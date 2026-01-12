// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { StartupMCTS, type Stats } from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// ✅ Vercel 캐시/ISR 영향 제거
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ------------------------------
// 1) Gemini 모델 목록(ListModels) 기반 Fallback (✅ 수정: "아까 위에서 한 대로" 안정화 버전)
// ------------------------------
type ModelInfo = {
  name?: string; // "models/gemini-1.5-flash" 형태
  supportedGenerationMethods?: string[]; // ["generateContent", ...]
};

const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var __GEMINI_MODEL_CACHE__:
    | { ts: number; models: string[] }
    | undefined;
}

function extractErrMsg(e: any): string {
  const parts: string[] = [];

  if (e?.message) parts.push(String(e.message));
  if (e?.cause?.message && e.cause.message !== e.message) {
    parts.push(`cause: ${e.cause.message}`);
  }

  const status = e?.cause?.status ?? e?.status ?? e?.response?.status;
  if (status) parts.push(`status: ${status}`);

  const data = e?.cause?.response?.data ?? e?.response?.data;
  if (data) {
    try {
      parts.push(
        `data: ${typeof data === "string" ? data : JSON.stringify(data)}`
      );
    } catch {
      // ignore
    }
  }

  return parts.join(" | ") || String(e);
}

async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  const cache = globalThis.__GEMINI_MODEL_CACHE__;
  if (
    cache &&
    Date.now() - cache.ts < MODEL_CACHE_TTL_MS &&
    cache.models.length
  ) {
    return cache.models;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
    apiKey
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `ListModels 실패: HTTP ${res.status} ${res.statusText}${
        text ? ` - ${text}` : ""
      }`
    );
  }

  const data = (await res.json()) as { models?: ModelInfo[] };

  // ✅ generateContent 지원 모델만 필터 + "models/" 제거
  const models =
    (data.models ?? [])
      .filter((m) =>
        (m.supportedGenerationMethods ?? []).includes("generateContent")
      )
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean) ?? [];

  globalThis.__GEMINI_MODEL_CACHE__ = { ts: Date.now(), models };
  return models;
}

function buildFallbackModels(available: string[]): string[] {
  // ✅ "gemini-pro"는 v1beta에서 404로 터지는 케이스가 많아서 제외
  const preferredPatterns = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.0-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
  ];

  const picked: string[] = [];
  const availSet = new Set(available);

  const pickOne = (pattern: string): string | null => {
    // exact
    if (availSet.has(pattern)) return pattern;

    // startsWith (e.g. -latest 붙은 모델)
    const starts = available.find((m) => m.startsWith(pattern));
    if (starts) return starts;

    // includes (느슨한 매칭)
    const includes = available.find((m) => m.includes(pattern));
    if (includes) return includes;

    return null;
  };

  for (const p of preferredPatterns) {
    const m = pickOne(p);
    if (m && !picked.includes(m)) picked.push(m);
  }

  // ✅ 그래도 부족하면 gemini* 모델을 더 붙임 (최대 8개)
  for (const m of available) {
    if (picked.length >= 8) break;
    if (!picked.includes(m) && m.startsWith("gemini") && m !== "gemini-pro") {
      picked.push(m);
    }
  }

  // ✅ ListModels가 비어있거나 이상하면 최소 하드코딩 안전망
  if (!picked.length) {
    const hardcoded = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
    ];
    return hardcoded;
  }

  return picked;
}

async function generateWithFallback<T>(
  apiKey: string,
  prompt: PromptTemplate,
  inputVariables: Record<string, any>,
  parser?: JsonOutputParser<T>
): Promise<T | any> {
  const available = await fetchAvailableModels(apiKey);
  const models = buildFallbackModels(available);

  let lastError: any = null;

  for (const modelName of models) {
    try {
      const llm = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey,
        temperature: 0.4, // 창의성 약간 증가
      });

      const chain = parser ? prompt.pipe(llm).pipe(parser) : prompt.pipe(llm);
      const result = await chain.invoke(inputVariables);
      return result as any;
    } catch (e: any) {
      console.warn(`⚠️ 모델 실패: ${modelName} -> ${extractErrMsg(e)}`);
      lastError = e;
    }
  }

  throw new Error(
    `모든 Gemini 모델 호출 실패. tried=${JSON.stringify(
      models
    )} available=${JSON.stringify(available)} last=${extractErrMsg(lastError)}`
  );
}

function getContent(res: any): string {
  if (typeof res === "string") return res;
  if (res?.content != null) return String(res.content);
  return JSON.stringify(res);
}

// ------------------------------
// 2) API 핸들러 (기존 코드 유지)
// ------------------------------
export async function POST(req: Request) {
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    if (!tavilyKey || !googleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API 키가 없습니다. Vercel 환경변수를 확인해주세요.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body?.productInfo?.name) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // ✅ 새로운 입력 데이터 받기
    const { sellerInfo, buyerInfo, productInfo, founderTraits } = body;

    console.log("🔥 분석 시작:", productInfo.name);

    // --- Tavily 검색 ---
    const tvly = tavily({ apiKey: tavilyKey });
    let marketData = "시장 데이터 없음";
    let pastCases: any[] = [];

    try {
      const searchResult = await tvly.search(
        `${productInfo.name} 시장 반응 실패 사례 경쟁사 문제점`,
        { searchDepth: "advanced", maxResults: 4 }
      );

      marketData = (searchResult.results ?? [])
        .map((r: any) => `- ${r.title}: ${r.content.slice(0, 300)}...`)
        .join("\n");

      pastCases = (searchResult.results ?? []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      }));
    } catch (e: any) {
      console.error("Tavily 검색 실패(무시):", e?.message ?? e);
    }

    // --- Stats (프롬프트 업데이트) ---
    const statsParser = new JsonOutputParser<Partial<Stats>>();

    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다. 입력된 정보와 시장 데이터를 바탕으로 5대 스탯(0~100)을 JSON으로 평가하라.
특히 '창업자 특성'을 'Team'과 'Strategy' 점수에 강력하게 반영하라.

입력 정보:
- 판매자: {sellerInfo}
- 타겟: {buyerInfo}
- 아이템: {productInfo}
- **창업자 특성(10점 만점)**: {founderTraits}

시장 데이터:
{marketData}

{format_instructions}
JSON 키: product, team, strategy, marketing, consumer_needs`
    );

    const rawStats = await generateWithFallback(
      googleKey,
      statsPrompt,
      {
        sellerInfo,
        buyerInfo,
        productInfo: JSON.stringify(productInfo),
        founderTraits: JSON.stringify(founderTraits),
        marketData,
        format_instructions: statsParser.getFormatInstructions(),
      },
      statsParser
    );

    const safeStats: Stats = {
      product: Number((rawStats as any)?.product) || 0,
      team: Number((rawStats as any)?.team) || 0,
      strategy: Number((rawStats as any)?.strategy) || 0,
      marketing: Number((rawStats as any)?.marketing) || 0,
      consumer_needs: Number((rawStats as any)?.consumer_needs) || 0,
    };

    // --- MCTS ---
    const mcts = new StartupMCTS(1500);
    const simulation = mcts.run(safeStats);

    // --- Report & Debate ---
    const reportParser = new JsonOutputParser<any>();
    const reportPrompt = PromptTemplate.fromTemplate(
      `냉소적인 VC로서 부검 리포트를 JSON으로 작성해라.
JSON 키: death_cause, autopsy_report, action_plan, needs_analysis
스탯: {stats}
가장 많이 죽은 구간: {bottleneck}
시장데이터: {marketData}
{format_instructions}`
    );

    const debatePrompt = PromptTemplate.fromTemplate(
      `아래 정보를 보고 3명의 전문가가 독설 좌담회를 열어라. (한국어 대화체)
1) 마포구 VC (냉소적) 2) 테헤란로 창업가 (현실적) 3) 까칠한 얼리어답터 (불만 많음)

아이템: {item}
스탯: {stats}

마지막에 "결론: 한 줄"을 포함하고, 그 아래에 이 아이템을 표현하는 **핵심 키워드 10개를 쉼표(,)로 구분하여 나열하라.** (예: 키워드: 가격, 디자인, 불필요 기능...)`
    );

    const [report, debateRes] = await Promise.all([
      generateWithFallback(
        googleKey,
        reportPrompt,
        {
          stats: JSON.stringify(safeStats),
          bottleneck: simulation.bottleneck,
          marketData,
          format_instructions: reportParser.getFormatInstructions(),
        },
        reportParser
      ),
      generateWithFallback(googleKey, debatePrompt, {
        item: JSON.stringify(productInfo),
        stats: JSON.stringify(safeStats),
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: safeStats,
      simulation,
      report,
      debate: getContent(debateRes),
      pastCases,
    });
  } catch (error: any) {
    console.error("Server Error:", extractErrMsg(error));
    return NextResponse.json(
      { success: false, error: extractErrMsg(error) },
      { status: 500 }
    );
  }
}
