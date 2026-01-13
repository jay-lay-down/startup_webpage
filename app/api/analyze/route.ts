// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import {
  StartupMCTS,
  type Stats,
  type MarketAssumptionsInput,
  type Tri,
} from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// ✅ Vercel 캐시/ISR 영향 제거
export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ✅ (권장) Edge 런타임 방지
export const runtime = "nodejs";

// ------------------------------
// 1) Gemini 모델 목록(ListModels) 기반 Fallback
// ------------------------------
type ModelInfo = {
  name?: string;
  supportedGenerationMethods?: string[];
};

const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var __GEMINI_MODEL_CACHE__: { ts: number; models: string[] } | undefined;
}

function extractErrMsg(e: any): string {
  const parts: string[] = [];
  if (e?.message) parts.push(String(e.message));
  if (e?.cause?.message && e.cause.message !== e.message) parts.push(`cause: ${e.cause.message}`);
  return parts.join(" | ") || String(e);
}

async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  const cache = globalThis.__GEMINI_MODEL_CACHE__;
  if (cache && Date.now() - cache.ts < MODEL_CACHE_TTL_MS && cache.models.length) return cache.models;

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`ListModels 실패: HTTP ${res.status} ${res.statusText}`);

  const data = (await res.json()) as { models?: ModelInfo[] };

  const models =
    (data.models ?? [])
      .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean) ?? [];

  globalThis.__GEMINI_MODEL_CACHE__ = { ts: Date.now(), models };
  return models;
}

function buildFallbackModels(available: string[]): string[] {
  const preferredPatterns = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro",
  ];

  const availSet = new Set(available);
  const picked: string[] = [];

  const pickOne = (pattern: string): string | null => {
    if (availSet.has(pattern)) return pattern;
    const starts = available.find((m) => m.startsWith(pattern));
    return starts ?? null;
  };

  for (const p of preferredPatterns) {
    const m = pickOne(p);
    if (m && !picked.includes(m)) picked.push(m);
  }

  return picked.length ? picked : available.slice(0, 3);
}

function hardFallbackModels(): string[] {
  return ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];
}

// ------------------------------
// 2) 모델 호출 유틸 (JSON / TEXT 분리)
// ------------------------------
async function getModelCandidates(apiKey: string): Promise<string[]> {
  try {
    const available = await fetchAvailableModels(apiKey);
    return buildFallbackModels(available);
  } catch (e) {
    console.warn(`⚠️ ListModels 실패 -> 하드코딩 모델로 fallback: ${extractErrMsg(e)}`);
    return hardFallbackModels();
  }
}

// ✅ JsonOutputParser 제약 회피
async function generateJsonWithFallback<T extends Record<string, any>>(
  apiKey: string,
  prompt: PromptTemplate,
  inputVariables: Record<string, any>,
  parser: JsonOutputParser<T>,
  temperature = 0.35
): Promise<T> {
  const models = await getModelCandidates(apiKey);
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const llm = new ChatGoogleGenerativeAI({ model: modelName, apiKey, temperature });
      const chain = prompt.pipe(llm).pipe(parser);
      return (await chain.invoke(inputVariables)) as T;
    } catch (e: any) {
      console.warn(`⚠️ 모델 실패(JSON): ${modelName} -> ${extractErrMsg(e)}`);
      lastError = e;
    }
  }

  throw new Error(`모든 Gemini 모델(JSON) 호출 실패. last=${extractErrMsg(lastError)}`);
}

async function generateTextWithFallback(
  apiKey: string,
  prompt: PromptTemplate,
  inputVariables: Record<string, any>,
  temperature = 0.35
): Promise<string> {
  const models = await getModelCandidates(apiKey);
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const llm = new ChatGoogleGenerativeAI({ model: modelName, apiKey, temperature });
      const chain = prompt.pipe(llm);
      const res: any = await chain.invoke(inputVariables);

      if (typeof res === "string") return res;
      if (res?.content != null) return String(res.content);
      return JSON.stringify(res);
    } catch (e: any) {
      console.warn(`⚠️ 모델 실패(TEXT): ${modelName} -> ${extractErrMsg(e)}`);
      lastError = e;
    }
  }

  throw new Error(`모든 Gemini 모델(TEXT) 호출 실패. last=${extractErrMsg(lastError)}`);
}

function toInt0to100(v: any, fallback = 35): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ✅ 마크다운 찌꺼기 제거
function stripMarkdownArtifacts(s: any): string {
  const text = String(s ?? "");
  return text
    .replace(/\*\*/g, "")
    .replace(/`+/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^#+\s*/gm, "")
    .trim();
}

// ------------------------------
// 2.5) 시장조사(AUTO) 유틸
// ------------------------------
type AutoMarketShape = {
  market_customers?: Tri;
  market_revenue?: Tri;
  price?: Tri;
  price_range_min?: number;
  price_range_max?: number;
  purchase_freq_per_year?: Tri;
  max_penetration?: Tri;
  assumed_fields?: string[];
  rationale?: string;
  currency_or_unit_note?: string;
};

type PriceRangeReference = {
  min?: number;
  max?: number;
  currency_or_unit_note?: string;
  source?: "tavily" | "user" | "synthetic";
};

function safeTri(v: any): Tri | undefined {
  if (!v || typeof v !== "object") return undefined;
  const min = Number(v.min);
  const mode = Number(v.mode);
  const max = Number(v.max);
  if (![min, mode, max].every(Number.isFinite)) return undefined;
  if (!(min <= mode && mode <= max)) return undefined;
  return { min, mode, max };
}

function safeNumValue(v: any): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parsePriceValue(raw: any): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const text = String(raw);
  const match = text.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function clampScore0to100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

type AgeBand = {
  min: number;
  max: number;
  label: string;
};

function extractAgeBand(text: string): AgeBand | null {
  if (!text) return null;
  const src = text.toLowerCase();
  const decadeMatch = src.match(/(\d{2})\s*대/);
  if (decadeMatch) {
    const decade = Number(decadeMatch[1]);
    if (Number.isFinite(decade) && decade >= 10 && decade <= 90) {
      return { min: decade, max: decade + 9, label: `${decade}대` };
    }
  }

  if (/(mz|엠지|m\s*z)/i.test(src)) return { min: 20, max: 39, label: "MZ" };
  if (/z세대|gen\s*z/.test(src)) return { min: 15, max: 29, label: "Z" };
  if (/알파세대|gen\s*alpha/.test(src)) return { min: 10, max: 14, label: "Alpha" };
  if (/대학생|college/.test(src)) return { min: 18, max: 25, label: "대학생" };
  if (/청소년|teen/.test(src)) return { min: 13, max: 19, label: "청소년" };
  if (/청년/.test(src)) return { min: 20, max: 34, label: "청년" };
  if (/중장년/.test(src)) return { min: 40, max: 69, label: "중장년" };
  if (/시니어|실버|노년|노인|장년/.test(src)) return { min: 60, max: 79, label: "시니어" };
  if (/화이트\s*칼라|office|직장인/.test(src)) return { min: 25, max: 49, label: "직장인" };

  return null;
}

function midpoint(band: AgeBand) {
  return (band.min + band.max) / 2;
}

function clampScore(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function extractMonthlyIncome(text: string): number | null {
  if (!text) return null;
  const src = text.replace(/,/g, "");
  const match = src.match(/(\d+(?:\.\d+)?)\s*(만|만원|천|천원|원)?/);
  if (!match) return null;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw)) return null;
  const unit = match[2] ?? "";
  if (unit === "만" || unit === "만원") return raw * 10000;
  if (unit === "천" || unit === "천원") return raw * 1000;
  if (unit === "원" || unit === "") return raw;
  return raw;
}

/**
 * ✅ 정교한 Context 조정 함수
 * 반환값: 조정된 Stats, 감지된 부조화 목록(warnings)
 */
function applyContextAdjustments(
  stats: Stats,
  context: {
    sellerInfo?: string;
    buyerInfo?: string;
    salesChannel?: string;
    price?: string;
  }
): { stats: Stats; warnings: string[] } {
  const updated = { ...stats };
  const warnings: string[] = [];

  const sellerBand = extractAgeBand(String(context.sellerInfo ?? ""));
  const buyerBand = extractAgeBand(String(context.buyerInfo ?? ""));
  const channelText = String(context.salesChannel ?? "").toLowerCase();
  const buyerIncome = extractMonthlyIncome(String(context.buyerInfo ?? ""));
  const priceValue = parsePriceValue(context.price);

  // 1) Founder - Market Fit (창업자와 타겟 간의 거리)
  if (sellerBand && buyerBand) {
    const gap = Math.abs(midpoint(sellerBand) - midpoint(buyerBand));
    if (gap >= 30) {
      // 30세 이상 차이 (예: 50대 창업자가 10대 타겟)
      updated.founder = clampScore(updated.founder - 12);
      updated.strategy = clampScore(updated.strategy - 10);
      updated.marketing = clampScore(updated.marketing - 8);
      warnings.push(`창업자(${sellerBand.label})와 타겟(${buyerBand.label})의 세대 차이가 커서 고객 니즈 파악이 어려울 수 있습니다.`);
    } else if (gap >= 20) {
      // 20세 이상 차이
      updated.founder = clampScore(updated.founder - 6);
      updated.strategy = clampScore(updated.strategy - 5);
      warnings.push(`창업자와 타겟 간의 세대 공감대 형성이 다소 어려울 수 있습니다.`);
    }
  }

  // 2) Channel - Market Fit (타겟과 채널의 불일치)
  const youthChannels = ["인스타", "instagram", "릴스", "reels", "틱톡", "tiktok", "쇼츠", "shorts", "snap", "디스코드", "discord"];
  const seniorChannels = ["네이버 밴드", "밴드", "band", "카카오톡", "카톡", "오프라인", "전단", "홈쇼핑", "신문", "라디오", "현수막", "약국", "마트", "전화"];
  const proChannels = ["링크드인", "linkedin", "이메일", "콜드콜", "세미나", "컨퍼런스"];

  if (buyerBand) {
    const isSenior = buyerBand.min >= 50;
    const isYoung = buyerBand.max <= 25;
    
    // 시니어 타겟인데 MZ 채널 사용
    if (isSenior && youthChannels.some((k) => channelText.includes(k))) {
      updated.marketing = clampScore(updated.marketing - 20);
      updated.distribution = clampScore(updated.distribution - 15);
      updated.potential_customers = clampScore(updated.potential_customers - 10);
      warnings.push(`고령층 타겟에게 적합하지 않은 마케팅 채널(틱톡/릴스 등)을 선택했습니다.`);
    }

    // 어린 타겟인데 시니어 채널 사용
    if (isYoung && seniorChannels.some((k) => channelText.includes(k))) {
      updated.marketing = clampScore(updated.marketing - 15);
      updated.distribution = clampScore(updated.distribution - 10);
      warnings.push(`젊은 세대 타겟에게 낡은 방식의 접근(밴드/전단지 등)을 사용하고 있습니다.`);
    }
  }

  // 3) Price - Income Fit (구매력 대비 가격)
  if (buyerIncome != null && priceValue != null) {
    // 월 소득 대비 제품 가격 비율
    const affordability = priceValue / Math.max(1, buyerIncome);
    
    if (affordability >= 0.5) {
      updated.price_fit = clampScore(updated.price_fit - 30);
      updated.consumer_needs = clampScore(updated.consumer_needs - 20);
      updated.potential_customers = clampScore(updated.potential_customers - 20);
      warnings.push(`타겟의 추정 소득 대비 가격이 너무 높아 구매 장벽이 매우 높습니다.`);
    } else if (affordability >= 0.2) {
      updated.price_fit = clampScore(updated.price_fit - 15);
      updated.consumer_needs = clampScore(updated.consumer_needs - 10);
      warnings.push(`타겟 소득 대비 가격 부담이 있어 구매 전환율이 낮을 수 있습니다.`);
    }
  }

  return { stats: updated, warnings };
}

function compactSources(results: any[], maxLen = 600) {
  return (results ?? []).map((r: any) => ({
    title: String(r?.title ?? "").slice(0, 160),
    url: String(r?.url ?? ""),
    content: String(r?.content ?? "").slice(0, maxLen),
  }));
}

function buildMarketSizingQuery(params: {
  productName: string;
  category?: string;
  salesCountry?: string;
  salesChannel?: string;
  businessModel?: string;
  price?: string;
}) {
  const { productName, category, salesCountry, salesChannel, businessModel, price } = params;

  // 한국어 + 영어 키워드 같이 넣어서 히트율 올림
  return [
    category || productName,
    salesCountry || "",
    salesChannel || "",
    businessModel || "",
    price || "",
    "시장 규모 TAM SAM 시장 매출 시장 크기",
    "market size TAM SAM market revenue",
    "average selling price 가격",
    "purchase frequency 구매 빈도 ARPU",
  ]
    .filter(Boolean)
    .join(" ");
}

async function autoBuildMarketAssumptions({
  googleKey,
  tvly,
  context,
}: {
  googleKey: string;
  tvly: ReturnType<typeof tavily>;
  context: {
    productName: string;
    productDesc: string;
    category?: string;
    salesCountry?: string;
    salesChannel?: string;
    businessModel?: string;
    price?: string;
  };
}): Promise<{
  assumptions: MarketAssumptionsInput | null;
  sizingDataText: string;
  sizingSources: Array<{ title: string; url: string; content: string }>;
  meta: { assumed_fields: string[]; rationale: string };
  priceRange?: PriceRangeReference | null;
}> {
  let sizingSources: Array<{ title: string; url: string; content: string }> = [];
  let sizingDataText = "시장규모 데이터 없음";
  let meta = { assumed_fields: [] as string[], rationale: "" };
  let priceRange: PriceRangeReference | null = null;

  try {
    const q = buildMarketSizingQuery({
      productName: context.productName,
      category: context.category,
      salesCountry: context.salesCountry,
      salesChannel: context.salesChannel,
      businessModel: context.businessModel,
      price: context.price,
    });

    const sr = await tvly.search(q, {
      searchDepth: "advanced",
      maxResults: 6,
    });

    sizingSources = compactSources(sr.results ?? [], 650);
    sizingDataText =
      sizingSources.length > 0
        ? sizingSources
            .map((r) => `- ${r.title}\n  url: ${r.url}\n  snippet: ${r.content}`)
            .join("\n")
        : "시장규모 데이터 없음";

    // Gemini로 Tri 추출
    const parser = new JsonOutputParser<AutoMarketShape>();

    const prompt = PromptTemplate.fromTemplate(
      `너는 "시장 데이터 추출기"다.
아래 Tavily 검색 결과(출처 포함)에서 가능한 한 숫자를 뽑아, 시장 시뮬레이션 입력(JSON)으로 정리하라.

목표:
- 가능하면 "연간" 기준으로 맞춰라. 불가하면 rationale에 기준을 적어라.
- 값은 가능하면 Tri(min/mode/max)로 제시하라.
- 출처에서 명시된 숫자가 없으면, "보수적 추정"으로 채우되 assumed_fields에 해당 키를 반드시 넣어라.
- max_penetration(0~1)은 "신규 브랜드/신규 제품이 12~24개월 내 현실적으로 달성 가능한 침투율 상한"으로 보수적으로 추정하라.
- 통화/단위(원/달러/명/가구 등)는 currency_or_unit_note에 명시하라.

반드시 출력할 JSON 키(없으면 null로 둬도 됨):
- market_customers: 전체 시장 고객수(연간 구매자 수 등)
- market_revenue: 전체 시장 매출(연간)
- price: 평균 판매가(1회 결제 기준)
- price_range_min: 유사 제품/대체재의 최저 가격
- price_range_max: 유사 제품/대체재의 최고 가격
- purchase_freq_per_year: 고객 1명당 연간 구매 횟수
- max_penetration: 침투율 상한(0~1)
- assumed_fields: 추정으로 채운 키 목록
- rationale: 짧은 근거(2~4문장)
- currency_or_unit_note: 단위/통화/기준기간 메모

아이템 컨텍스트:
- name: {name}
- desc: {desc}
- category: {category}
- country: {country}
- channel: {channel}
- businessModel: {bm}
- listedPriceHint: {priceHint}

Tavily 결과:
{sources}

주의:
- JSON만 출력
- Tri는 반드시 min<=mode<=max, 숫자만
- max_penetration은 0~1

{format_instructions}`
    );

    const raw = await generateJsonWithFallback<AutoMarketShape>(
      googleKey,
      prompt,
      {
        name: context.productName,
        desc: context.productDesc,
        category: String(context.category ?? ""),
        country: String(context.salesCountry ?? ""),
        channel: String(context.salesChannel ?? ""),
        bm: String(context.businessModel ?? ""),
        priceHint: String(context.price ?? ""),
        sources: sizingDataText,
        format_instructions: parser.getFormatInstructions(),
      },
      parser,
      0.25
    );

    const assumptions: MarketAssumptionsInput = {
      market_customers: safeTri(raw.market_customers),
      market_revenue: safeTri(raw.market_revenue),
      price: safeTri(raw.price),
      purchase_freq_per_year: safeTri(raw.purchase_freq_per_year),
      max_penetration: safeTri(raw.max_penetration),
      source: "tavily",
    };

    const minPrice = safeNumValue((raw as any).price_range_min);
    const maxPrice = safeNumValue((raw as any).price_range_max);
    if (minPrice != null || maxPrice != null) {
      priceRange = {
        min: minPrice,
        max: maxPrice,
        currency_or_unit_note: String((raw as any).currency_or_unit_note ?? ""),
        source: "tavily",
      };
    }

    meta = {
      assumed_fields: Array.isArray(raw.assumed_fields) ? raw.assumed_fields.map(String) : [],
      rationale: String(raw.rationale ?? ""),
    };

    return {
      assumptions,
      sizingDataText,
      sizingSources,
      meta,
      priceRange,
    };
  } catch (e: any) {
    console.error("Tavily/시장규모 추출 실패(무시하고 계속):", extractErrMsg(e));
    return {
      assumptions: null,
      sizingDataText,
      sizingSources,
      meta,
      priceRange,
    };
  }
}

// ------------------------------
// 3) API 핸들러
// ------------------------------
export async function POST(req: Request) {
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    if (!tavilyKey || !googleKey) {
      return NextResponse.json(
        { success: false, error: "API 키가 없습니다. Vercel 환경변수(Settings)를 확인해주세요." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);

    const language = body?.language ?? "ko";
    const sellerInfo = body?.sellerInfo ?? "";
    const buyerInfo = body?.buyerInfo ?? "";
    const productInfo = body?.productInfo ?? null;
    const founderTraits = body?.founderTraits ?? null;

    if (!productInfo?.name || !productInfo?.desc) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다. (productInfo.name, productInfo.desc)" },
        { status: 400 }
      );
    }

    // ✅ 새 설문 항목
    const concept = body?.concept ?? productInfo?.concept ?? "";
    const price = body?.price ?? productInfo?.price ?? "";
    const businessModel = body?.businessModel ?? productInfo?.businessModel ?? productInfo?.bm ?? "";
    const salesChannel = body?.salesChannel ?? productInfo?.salesChannel ?? productInfo?.channel ?? "";
    const salesCountry = body?.salesCountry ?? productInfo?.salesCountry ?? productInfo?.country ?? "";
    const category = body?.category ?? productInfo?.category ?? "";

    const enrichedProductInfo = {
      ...productInfo,
      concept,
      price,
      businessModel,
      salesChannel,
      salesCountry,
      category,
    };

    // ✅ 시장 모드(프론트에서 체크박스로 보낼 값)
    // - "none": 시장점유율 계산 안 함(필요하다고만 알려줌)
    // - "manual": 사용자가 marketAssumptions를 직접 입력
    // - "auto": Tavily+Gemini로 자동조사
    const marketMode: "none" | "manual" | "auto" =
      body?.marketMode ??
      body?.market_mode ??
      (body?.autoMarket ? "auto" : body?.marketAssumptions ? "manual" : "none");

    const manualMarketAssumptions: MarketAssumptionsInput | null =
      (body?.marketAssumptions as any) ?? (body?.market_assumptions as any) ?? null;

    console.log("🔥 분석 시작:", productInfo.name, "| marketMode:", marketMode);

    const tvly = tavily({ apiKey: tavilyKey });

    // --- Tavily 검색 (유사아이템/실패사례/리뷰 불만 등) ---
    let marketData = "시장 데이터 없음";
    let pastCases: Array<{ title: string; url: string; content: string }> = [];

    try {
      const q = [
        productInfo.name,
        category,
        salesCountry,
        salesChannel,
        typeof price === "string" ? price : String(price ?? ""),
        "실패 사례",
        "경쟁사",
        "리뷰 불만",
        "대체재",
      ]
        .filter(Boolean)
        .join(" ");

      const searchResult = await tvly.search(q, { searchDepth: "advanced", maxResults: 5 });

      marketData = (searchResult.results ?? [])
        .map((r: any) => `- ${r.title}: ${String(r.content).slice(0, 400)}...`)
        .join("\n");

      pastCases = (searchResult.results ?? []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      }));
    } catch (e: any) {
      console.error("Tavily 검색 실패(무시하고 진행):", extractErrMsg(e));
    }

    // --- AUTO 시장규모/가격/빈도 수집 ---
    let marketSizingData = "시장규모 데이터 없음";
    let marketSizingSources: Array<{ title: string; url: string; content: string }> = [];
    let marketAutoMeta: { assumed_fields: string[]; rationale: string } = { assumed_fields: [], rationale: "" };

    let marketAssumptionsForMcts: MarketAssumptionsInput | undefined = undefined;
    let priceReference: PriceRangeReference | null = null;
    const inputPriceValue = parsePriceValue(price);

    if (marketMode === "manual" && manualMarketAssumptions) {
      marketAssumptionsForMcts = { ...(manualMarketAssumptions as any), source: "user" };
    }

    if (marketMode === "auto") {
      const auto = await autoBuildMarketAssumptions({
        googleKey,
        tvly,
        context: {
          productName: String(productInfo.name),
          productDesc: String(productInfo.desc ?? ""),
          category: String(category ?? ""),
          salesCountry: String(salesCountry ?? ""),
          salesChannel: String(salesChannel ?? ""),
          businessModel: String(businessModel ?? ""),
          price: typeof price === "string" ? price : String(price ?? ""),
        },
      });

      marketAssumptionsForMcts = auto.assumptions ?? undefined;
      marketSizingData = auto.sizingDataText;
      marketSizingSources = auto.sizingSources;
      marketAutoMeta = auto.meta;
      priceReference = auto.priceRange ?? null;
    }

    // ✅ LLM에 들어갈 시장데이터는 합쳐서(실패사례 + 규모)
    const combinedMarketData =
      marketMode === "auto"
        ? `${marketData}\n\n[시장규모/가격/빈도]\n${marketSizingData}`
        : marketData;

    // ------------------------------
    // ✅ Stats JSON (11개 스탯) - 정교한 채점 프롬프트 반영
    // ------------------------------
    const statsParser = new JsonOutputParser<Stats>();

    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 VC(벤처 캐피탈리스트) 심사역이다.
아래 스타트업 정보를 분석하여 0~100점 사이의 점수를 매겨라.

[정성적 평가 핵심 기준 - 매우 중요]
1. Founder-Market Fit (창업자-시장 적합성):
   - 창업자의 연령대/경험(SellerInfo)과 타겟 고객(BuyerInfo)이 매칭되는가?
   - 예: 50대 창업자가 10대 문화를 모른 채 숏폼 앱을 만든다면 'founder', 'strategy', 'marketing' 점수를 대폭 깎아라.
   - 예: 개발자 출신이 영업력이 필수인 B2B 사업을 하면서 영업 경험이 없다면 'founder', 'strategy' 감점.

2. Channel-Market Fit (채널-시장 적합성):
   - 타겟 고객의 연령대/성향과 판매 채널이 일치하는가?
   - 예: 60대 시니어 타겟인데 '틱톡/릴스' 마케팅을 한다면 'marketing', 'distribution' 점수를 대폭 깎아라.
   - 예: 20대 타겟인데 '전단지/오프라인 영업'을 주력으로 한다면 감점하라.

3. Product-Market Fit (제품-시장 적합성):
   - '컨셉'이 '타겟'의 진짜 고통(Needs)을 해결하는가?
   - 가격이 타겟의 지불 능력(Income) 대비 합리적인가?

[채점 가이드라인]
- 30~50점: 일반적이고 평범한 수준 (대부분의 초기 아이디어)
- 60점 이상: 명확한 타겟과 엣지가 있는 경우
- 80점 이상: 이미 트랙션(매출/유저)이 있거나, 창업자가 해당 분야 슈퍼 전문가인 경우에만 허용
- 근거 없는 낙관적 평가는 절대 금지. 차라리 점수를 낮게 주고 이유를 리포트에 적어라.

추가 설문 항목:
- 컨셉: {concept}
- 가격: {price}
- BM: {businessModel}
- 채널: {salesChannel}
- 국가: {salesCountry}
- 카테고리: {category}

입력 정보:
- 판매자(창업자): {sellerInfo}
- 타겟 고객: {buyerInfo}
- 아이템: {productInfo}
- 창업자 자가진단(1~10): {founderTraits}

시장 데이터:
{marketData}

출력 포맷(JSON):
{{
  "product": 0,
  "founder": 0,
  "strategy": 0,
  "marketing": 0,
  "consumer_needs": 0,
  "concept_fit": 0,
  "price_fit": 0,
  "business_model_fit": 0,
  "distribution": 0,
  "market_scope": 0,
  "potential_customers": 0
}}

{format_instructions}`
    );

    const rawStats = await generateJsonWithFallback<Stats>(
      googleKey,
      statsPrompt,
      {
        sellerInfo,
        buyerInfo,
        productInfo: JSON.stringify(enrichedProductInfo),
        founderTraits: JSON.stringify(founderTraits ?? {}),
        marketData: combinedMarketData,
        concept: String(concept ?? ""),
        price: typeof price === "string" ? price : String(price ?? ""),
        businessModel: String(businessModel ?? ""),
        salesChannel: String(salesChannel ?? ""),
        salesCountry: String(salesCountry ?? ""),
        category: String(category ?? ""),
        format_instructions: statsParser.getFormatInstructions(),
      },
      statsParser,
      0.3
    );

    // ✅ 안전 보정
    const safeStats: Stats = {
      product: toInt0to100((rawStats as any).product, 35),
      founder: toInt0to100((rawStats as any).founder, 35),
      strategy: toInt0to100((rawStats as any).strategy, 35),
      marketing: toInt0to100((rawStats as any).marketing, 35),
      consumer_needs: toInt0to100((rawStats as any).consumer_needs, 35),

      concept_fit: toInt0to100((rawStats as any).concept_fit, 35),
      price_fit: toInt0to100((rawStats as any).price_fit, 35),
      business_model_fit: toInt0to100((rawStats as any).business_model_fit, 35),
      distribution: toInt0to100((rawStats as any).distribution, 35),
      market_scope: toInt0to100((rawStats as any).market_scope, 35),
      potential_customers: toInt0to100((rawStats as any).potential_customers, 35),
    };

    // ✅ 정교한 Context Adjustment 적용 (Warning 메시지 생성 포함)
    const { stats: contextAdjustedStats, warnings: fitWarnings } = applyContextAdjustments(safeStats, {
      sellerInfo,
      buyerInfo,
      salesChannel,
      price: typeof price === "string" ? price : String(price ?? ""),
    });

    const adjustedPriceFit = (() => {
      if (!priceReference || inputPriceValue == null) return contextAdjustedStats.price_fit;
      const min = Number(priceReference.min);
      const max = Number(priceReference.max);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0 || min > max) {
        return contextAdjustedStats.price_fit;
      }
      let penalty = 0;
      if (inputPriceValue < min) {
        penalty = ((min - inputPriceValue) / min) * 120;
      } else if (inputPriceValue > max) {
        penalty = ((inputPriceValue - max) / max) * 120;
      } else {
        penalty = -5;
      }
      return clampScore0to100(contextAdjustedStats.price_fit - penalty);
    })();

    const finalStats: Stats = {
      ...contextAdjustedStats,
      price_fit: adjustedPriceFit,
    };

    // --- MCTS (시장점유율 포함) ---
    const mcts = new StartupMCTS(1500);

    const simulation = mcts.runWithMarket(
      finalStats,
      marketAssumptionsForMcts,
      { allow_synthetic_fallback: marketMode === "auto" }
    );

    // ------------------------------
    // --- Report JSON ---
    // ------------------------------
    type ReportShape = {
      death_cause: string;
      autopsy_report: string;
      action_plan: string;
      needs_analysis: string;
      youtube_queries: string[];
      keywords: string[];
      market_takeaway?: string;
    };

    const weaknessFactors = (() => {
      const pairs: Array<{ key: string; label: string; score: number }> = [
        { key: "concept_fit", label: "컨셉", score: finalStats.concept_fit },
        { key: "price_fit", label: "가격", score: finalStats.price_fit },
        { key: "business_model_fit", label: "BM", score: finalStats.business_model_fit },
        { key: "distribution", label: "채널/유통", score: finalStats.distribution },
        { key: "market_scope", label: "시장 확장성", score: finalStats.market_scope },
        { key: "potential_customers", label: "잠재고객", score: finalStats.potential_customers },
        { key: "product", label: "제품력", score: finalStats.product },
        { key: "strategy", label: "전략", score: finalStats.strategy },
        { key: "marketing", label: "마케팅", score: finalStats.marketing },
        { key: "consumer_needs", label: "니즈", score: finalStats.consumer_needs },
        { key: "founder", label: "창업자", score: finalStats.founder },
      ];
      return pairs.sort((a, b) => a.score - b.score).slice(0, 3);
    })();

    const reportParser = new JsonOutputParser<ReportShape>();
    const reportPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 VC다. 아래 정보를 바탕으로 '부검 리포트'를 JSON으로 작성하라.

[매우 중요 - 감지된 문제점]
아래 경고(Warnings)가 있다면, 반드시 'death_cause'와 'autopsy_report'에 포함시켜 강력하게 비판하라:
{fitWarnings}

요구 JSON 키:
- death_cause: 경고 메시지(Warnings)가 있다면 그것을 우선적으로 언급하고, 없다면 약점 TOP3를 근거로 작성. 짧고 강렬하게.
- autopsy_report: 상세 분석 (경고 메시지의 구체적 이유 포함)
- needs_analysis: 타겟 니즈 분석 (경고 메시지가 있다면 타겟 이해도 부족을 지적)
- action_plan: 1. ~ \n 2. ~ 형태 (마크다운 ** 사용 금지)
- youtube_queries: 검색어 3개
- keywords: 키워드 10개
- market_takeaway (선택): 시장 규모 코멘트

입력:
- 아이템: {item}
- 스탯: {stats}
- 시뮬레이션: {sim}
- 병목 단계: {bottleneck}
- 점수 약점 TOP3: {weaknessFactors}
- 시장데이터: {marketData}

{format_instructions}`
    );

    const reportRaw = await generateJsonWithFallback<ReportShape>(
      googleKey,
      reportPrompt,
      {
        item: JSON.stringify(enrichedProductInfo),
        stats: JSON.stringify(finalStats),
        sim: JSON.stringify(simulation),
        bottleneck: (simulation as any).bottleneck_stage ?? (simulation as any).bottleneck ?? "",
        weaknessFactors: JSON.stringify(weaknessFactors),
        marketData: combinedMarketData,
        fitWarnings: fitWarnings.length > 0 ? `🚨 경고:\n` + fitWarnings.map(w => `- ${w}`).join("\n") : "없음",
        format_instructions: reportParser.getFormatInstructions(),
      },
      reportParser,
      0.35
    );

    const report: ReportShape = {
      ...reportRaw,
      action_plan: stripMarkdownArtifacts(reportRaw.action_plan),
      autopsy_report: String(reportRaw.autopsy_report ?? ""),
      needs_analysis: String(reportRaw.needs_analysis ?? ""),
      death_cause: String(reportRaw.death_cause ?? ""),
      youtube_queries: Array.isArray(reportRaw.youtube_queries) ? reportRaw.youtube_queries.slice(0, 3) : [],
      keywords: Array.isArray(reportRaw.keywords) ? reportRaw.keywords.slice(0, 10) : [],
      market_takeaway: String((reportRaw as any).market_takeaway ?? ""),
    };

    // --- Consistency Validator (stats vs. narrative) ---
    type ValidateShape = {
      needs_analysis: string;
      death_cause: string;
    };

    const validateParser = new JsonOutputParser<ValidateShape>();
    const validatePrompt = PromptTemplate.fromTemplate(
      `너는 일관성 검증관이다.
만약 아래 '감지된 문제점(Warnings)'이 존재한다면, death_cause와 needs_analysis에 그 내용이 명확히 반영되었는지 확인하고 수정하라.

감지된 문제점:
{fitWarnings}

규칙:
- 문제점이 있다면 death_cause에 반드시 포함.
- needs_analysis가 부정적이면 consumer_needs 점수와 톤앤매너 일치시킬 것.
- JSON만 출력.

입력 stats: {stats}
현재 death_cause: {death_cause}
현재 needs: {needs}

{format_instructions}`
    );

    const validated = await generateJsonWithFallback<ValidateShape>(
      googleKey,
      validatePrompt,
      {
        stats: JSON.stringify(finalStats),
        death_cause: report.death_cause,
        needs: report.needs_analysis,
        fitWarnings: fitWarnings.length > 0 ? fitWarnings.join("\n") : "없음",
        format_instructions: validateParser.getFormatInstructions(),
      },
      validateParser,
      0.2
    );

    report.needs_analysis = stripMarkdownArtifacts(validated.needs_analysis ?? report.needs_analysis);
    report.death_cause = stripMarkdownArtifacts(validated.death_cause ?? report.death_cause);

    const launchReadiness = Math.round(
      0.5 * finalStats.consumer_needs + 0.25 * finalStats.distribution + 0.25 * finalStats.business_model_fit
    );
    const pmfProbability =
      Math.round(((simulation as any)?.stage_reach_rates?.PMF ?? (simulation as any)?.stageReachRates?.PMF ?? 0) * 1000) /
      10;
    const unicornProbability = Math.round((Number((simulation as any)?.survival_rate ?? (simulation as any)?.survivalRate ?? 0)) * 10) / 10;

    // --- Debate TEXT ---
    const debateLangInstr = language === "en" ? "Write the conversation in natural English." : "한국어 대화체로 작성.";

    const debatePrompt = PromptTemplate.fromTemplate(
      `아래 정보를 보고 3명의 전문가가 독설 좌담회를 열어라.
${debateLangInstr}

특히 아래 감지된 문제점이 있다면 이를 중심으로 맹렬히 비판하라:
{fitWarnings}

1) 마포구 VC (냉소적) 2) 테헤란로 창업가 (현실적) 3) 까칠한 얼리어답터 (불만 많음)

아이템/설문: {item}
스탯: {stats}
시장데이터 요약: {marketData}
시장점유율/레이어(있으면): {marketShare}

형식:
- 대화체로 줄바꿈
- 마지막 줄에 "결론: 한 줄"로 끝내라`
    );

    const debate = await generateTextWithFallback(
      googleKey,
      debatePrompt,
      {
        item: JSON.stringify(enrichedProductInfo),
        stats: JSON.stringify(finalStats),
        marketData: combinedMarketData,
        marketShare: JSON.stringify((simulation as any).market_share ?? null),
        fitWarnings: fitWarnings.length > 0 ? fitWarnings.join(", ") : "없음",
      },
      0.45
    );

    return NextResponse.json({
      success: true,

      stats: finalStats, // ✅ 11개 스탯
      simulation,       // ✅ survival + (market_needed/market_share/market_layers 포함)
      rollups: {
        launch_readiness: launchReadiness,
        pmf_probability: pmfProbability,
        unicorn_probability: unicornProbability,
      },
      priceReference: priceReference
        ? {
            ...priceReference,
            user_price: inputPriceValue,
          }
        : inputPriceValue == null
          ? null
          : { user_price: inputPriceValue },
      report,
      debate,

      pastCases, // ✅ 기존 유지

      // ✅ AUTO 시장조사 결과
      marketMode,
      marketAssumptionsUsed:
        (simulation as any)?.market_assumptions ?? (simulation as any)?.marketAssumptions ?? marketAssumptionsForMcts ?? null,
      marketSizingSources: marketMode === "auto" ? marketSizingSources : [],
      marketAutoMeta: marketMode === "auto" ? marketAutoMeta : null,
    });
  } catch (error: any) {
    console.error("Server Error:", extractErrMsg(error));
    return NextResponse.json({ success: false, error: extractErrMsg(error) }, { status: 500 });
  }
}
