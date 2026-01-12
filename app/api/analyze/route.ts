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
  purchase_freq_per_year?: Tri;
  max_penetration?: Tri;
  assumed_fields?: string[];
  rationale?: string;
  currency_or_unit_note?: string;
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
}> {
  let sizingSources: Array<{ title: string; url: string; content: string }> = [];
  let sizingDataText = "시장규모 데이터 없음";
  let meta = { assumed_fields: [] as string[], rationale: "" };

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

    meta = {
      assumed_fields: Array.isArray(raw.assumed_fields) ? raw.assumed_fields.map(String) : [],
      rationale: String(raw.rationale ?? ""),
    };

    return {
      assumptions,
      sizingDataText,
      sizingSources,
      meta,
    };
  } catch (e: any) {
    console.error("Tavily/시장규모 추출 실패(무시하고 계속):", extractErrMsg(e));
    return {
      assumptions: null,
      sizingDataText,
      sizingSources,
      meta,
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
    }

    // ✅ LLM에 들어갈 시장데이터는 합쳐서(실패사례 + 규모)
    const combinedMarketData =
      marketMode === "auto"
        ? `${marketData}\n\n[시장규모/가격/빈도]\n${marketSizingData}`
        : marketData;

    // ------------------------------
    // ✅ Stats JSON (11개 스탯)
    // ------------------------------
    const statsParser = new JsonOutputParser<Stats>();

    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다.
아래 정보와 시장데이터를 기반으로 스탯(0~100 정수)을 JSON으로 출력하라.

중요:
- 초기 스타트업은 팀이 없을 수 있다. 따라서 'team'을 평가하지 않는다.
- 대신 창업자 개인 역량을 'founder' 점수로 평가한다.
- founder 점수는 아래 '창업자 특성(1~10)'을 강하게 반영하라.
- strategy 점수에도 창업자 특성(실행력/불확실성 내성/설득력/리소스 감각)을 반영하라.

[채점 규칙(중요)]
- 대부분의 아이디어는 40~55가 정상 범위다. 근거 없이 70+를 주지 마라.
- 70+는 구체적 근거(명확한 타겟, 대체재 대비 큰 개선, 현실적 채널/CAC 추정 등)가 있을 때만 가능.
- 85+는 트랙션/실적 등 강한 증거 없으면 금지.
- business_model_fit < 40 또는 distribution < 40이면 consumer_needs는 최대 65로 캡.
- consumer_needs가 70+면 needs_analysis에서 지불의사/긴급성/대체재 대비 우위를 반드시 긍정적으로 설명해야 한다.
- needs_analysis가 부정적이면 consumer_needs를 55 이하로 내린다.

추가 설문 항목(반드시 반영):
- 컨셉: {concept}
- 가격: {price}
- BM(돈 버는 법): {businessModel}
- 판매채널: {salesChannel}
- 판매국가: {salesCountry}
- 카테고리: {category}

추가 스탯 정의(0~100):
- concept_fit: 컨셉 명확도/차별성/포지셔닝 적합
- price_fit: 가격의 합리성/지불의사/가격-가치 정합성
- business_model_fit: BM(수익모델/마진/단위경제) 타당성
- distribution: 판매채널 적합도 + 실행 난이도(운영/물류/파트너) + 고객획득 현실성
- market_scope: 국가/카테고리의 규제/경쟁/확장성(멀티국가/멀티세그로 갈 수 있는지)
- potential_customers: 잠재고객 규모(지갑 있는 사람) + 도달가능성(채널/국가/가격 기준)

입력 정보:
- 판매자: {sellerInfo}
- 타겟: {buyerInfo}
- 아이템: {productInfo}
- 창업자 특성(1~10): {founderTraits}

시장 데이터:
{marketData}

주의:
- JSON만 출력 (설명/문장 금지)
- 값은 0~100 정수

{format_instructions}

JSON 키(정확히 이 키들로):
product, founder, strategy, marketing, consumer_needs,
concept_fit, price_fit, business_model_fit, distribution, market_scope, potential_customers`
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

    // --- MCTS (시장점유율 포함) ---
    const mcts = new StartupMCTS(1500);

    // ✅ 기본: manual/none은 synthetic fallback 금지
    // - auto 모드에서는 부족한 값이 있어도 prior로 채워서 시장규모 계산은 진행
    const simulation = mcts.runWithMarket(
      safeStats,
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
        { key: "concept_fit", label: "컨셉", score: safeStats.concept_fit },
        { key: "price_fit", label: "가격", score: safeStats.price_fit },
        { key: "business_model_fit", label: "BM", score: safeStats.business_model_fit },
        { key: "distribution", label: "채널/유통", score: safeStats.distribution },
        { key: "market_scope", label: "시장 확장성", score: safeStats.market_scope },
        { key: "potential_customers", label: "잠재고객", score: safeStats.potential_customers },
        { key: "product", label: "제품력", score: safeStats.product },
        { key: "strategy", label: "전략", score: safeStats.strategy },
        { key: "marketing", label: "마케팅", score: safeStats.marketing },
        { key: "consumer_needs", label: "니즈", score: safeStats.consumer_needs },
        { key: "founder", label: "창업자", score: safeStats.founder },
      ];
      return pairs.sort((a, b) => a.score - b.score).slice(0, 3);
    })();

    const reportParser = new JsonOutputParser<ReportShape>();
    const reportPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 VC다. 아래 정보를 바탕으로 '부검 리포트'를 JSON으로 작성하라.

요구 JSON 키:
- death_cause (짧게)
- autopsy_report (줄글)
- needs_analysis (줄글)
- action_plan (번호 리스트를 "1. ...\\n2. ..." 형태로. 마크다운 금지. **, *, # 같은 기호 쓰지 마.)
- youtube_queries (배열, string 3개: "아이템/시장/실패사례"로 유튜브 검색할 문장)
- keywords (배열, string 10개: 워드클라우드용 핵심 키워드)
- market_takeaway (선택): 시장점유율/시장규모 기반으로 한 줄 코멘트

입력:
- 아이템/설문: {item}
- 스탯: {stats}
- 시뮬레이션: {sim}
- 드랍률 기준 병목: {bottleneck}
- 점수 약점 TOP3: {weaknessFactors}
- 시장데이터: {marketData}

주의:
- JSON만 출력
- action_plan에 마크다운 금지(특히 ** 사용 금지)
- keywords는 "단어/짧은 구" 중심
- death_cause는 bottleneck 단계가 아니라 점수 약점 TOP3를 근거로 짧게 요약

{format_instructions}`
    );

    const reportRaw = await generateJsonWithFallback<ReportShape>(
      googleKey,
      reportPrompt,
      {
        item: JSON.stringify(enrichedProductInfo),
        stats: JSON.stringify(safeStats),
        sim: JSON.stringify(simulation),
        bottleneck: (simulation as any).bottleneck_stage ?? (simulation as any).bottleneck ?? "",
        weaknessFactors: JSON.stringify(weaknessFactors),
        marketData: combinedMarketData,
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
      `너는 일관성 검증관이다. 아래 stats와 needs_analysis가 모순되면 반드시 수정하라.

규칙:
- needs_analysis가 부정적/회의적이면 consumer_needs는 55 이하가 자연스럽다. 문장을 그에 맞게 정리하라.
- consumer_needs가 70 이상이면 지불의사/긴급성/대체재 대비 우위가 명확히 긍정적으로 드러나야 한다.
- business_model_fit < 40 또는 distribution < 40이면 지나친 낙관을 제거하라.
- death_cause는 점수 약점 TOP3를 근거로 짧게 요약하라.

입력 stats: {stats}
입력 needs_analysis: {needs}
점수 약점 TOP3: {weaknessFactors}

JSON만 출력.
{format_instructions}`
    );

    const validated = await generateJsonWithFallback<ValidateShape>(
      googleKey,
      validatePrompt,
      {
        stats: JSON.stringify(safeStats),
        needs: report.needs_analysis,
        weaknessFactors: JSON.stringify(weaknessFactors),
        format_instructions: validateParser.getFormatInstructions(),
      },
      validateParser,
      0.2
    );

    report.needs_analysis = stripMarkdownArtifacts(validated.needs_analysis ?? report.needs_analysis);
    report.death_cause = stripMarkdownArtifacts(validated.death_cause ?? report.death_cause);

    const launchReadiness = Math.round(
      0.5 * safeStats.consumer_needs + 0.25 * safeStats.distribution + 0.25 * safeStats.business_model_fit
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
        stats: JSON.stringify(safeStats),
        marketData: combinedMarketData,
        marketShare: JSON.stringify((simulation as any).market_share ?? null),
      },
      0.45
    );

    return NextResponse.json({
      success: true,

      stats: safeStats, // ✅ 11개 스탯
      simulation,       // ✅ survival + (market_needed/market_share/market_layers 포함)
      rollups: {
        launch_readiness: launchReadiness,
        pmf_probability: pmfProbability,
        unicorn_probability: unicornProbability,
      },
      report,
      debate,

      pastCases, // ✅ 기존 유지

      // ✅ AUTO 시장조사 결과(프론트에서 "근거 보기"에 쓰기 좋음)
      marketMode,
      marketAssumptionsUsed: marketAssumptionsForMcts ?? null,
      marketSizingSources: marketMode === "auto" ? marketSizingSources : [],
      marketAutoMeta: marketMode === "auto" ? marketAutoMeta : null,
    });
  } catch (error: any) {
    console.error("Server Error:", extractErrMsg(error));
    return NextResponse.json({ success: false, error: extractErrMsg(error) }, { status: 500 });
  }
}
