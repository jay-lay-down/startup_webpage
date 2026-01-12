// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { StartupMCTS, type Stats } from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  if (cache && Date.now() - cache.ts < MODEL_CACHE_TTL_MS && cache.models.length) {
    return cache.models;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ListModels 실패: HTTP ${res.status} ${res.statusText}`);
  }

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
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro",
  ];

  const picked: string[] = [];
  const availSet = new Set(available);

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
        temperature: 0.35,
      });

      const chain = parser ? prompt.pipe(llm).pipe(parser) : prompt.pipe(llm);
      return await chain.invoke(inputVariables);
    } catch (e: any) {
      console.warn(`⚠️ 모델 실패: ${modelName} -> ${extractErrMsg(e)}`);
      lastError = e;
    }
  }

  throw new Error(`모든 Gemini 모델 호출 실패. last=${extractErrMsg(lastError)}`);
}

function getContent(res: any): string {
  if (typeof res === "string") return res;
  if (res?.content != null) return String(res.content);
  return JSON.stringify(res);
}

// ------------------------------
// 2) API 핸들러
// ------------------------------
export async function POST(req: Request) {
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    if (!tavilyKey || !googleKey) {
      return NextResponse.json(
        { success: false, error: "API 키가 없습니다. Vercel 환경변수를 확인해주세요." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body?.productInfo?.name) {
      return NextResponse.json({ success: false, error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const language = body.language === "en" ? "en" : "ko";
    const { sellerInfo, buyerInfo, productInfo, founderTraits } = body;

    console.log("🔥 분석 시작:", productInfo?.name);

    // --- Tavily 검색 (유사 사례/경쟁사/문제점) ---
    const tvly = tavily({ apiKey: tavilyKey });
    let marketData = "시장 데이터 없음";
    let pastCases: any[] = [];

    try {
      const searchResult = await tvly.search(`${productInfo.name} 실패 사례 경쟁사 문제점 불만 리뷰`, {
        searchDepth: "advanced",
        maxResults: 5,
      });

      marketData = (searchResult.results ?? [])
        .map((r: any) => `- ${r.title}: ${String(r.content ?? "").slice(0, 350)}...`)
        .join("\n");

      pastCases = (searchResult.results ?? []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      }));
    } catch (e: any) {
      console.error("Tavily 검색 실패(무시):", e?.message);
    }

    // --- Stats ---
    const statsParser = new JsonOutputParser<Partial<Stats>>();
    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다.
출력 언어는 {language}에 맞춰라. (ko=한국어, en=English)
절대 마크다운 문법(**, *, #, \`\`\`)을 사용하지 말고, 평문으로만 작성하라.

입력 정보:
- 판매자: {sellerInfo}
- 타겟: {buyerInfo}
- 아이템: {productInfo}
- 창업자 특성(10점 만점): {founderTraits}

시장 데이터:
{marketData}

{format_instructions}

JSON 키: product, team, strategy, marketing, consumer_needs
모든 값은 0~100 정수로 출력.`
    );

    const rawStats = await generateWithFallback(
      googleKey,
      statsPrompt,
      {
        language,
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

    // --- Report (유튜브 쿼리 + 키워드 포함, 마크다운 금지) ---
    const reportParser = new JsonOutputParser<any>();
    const reportPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 VC다. 아래 정보를 바탕으로 "부검 리포트"를 JSON으로 작성하라.
출력 언어는 {language}에 맞춰라. (ko=한국어, en=English)
절대 마크다운 문법(**, *, #, \`\`\`)을 사용하지 말고, 평문으로만 작성하라.
특히 굵게(**) 같은 표시 절대 금지.

스탯: {stats}
가장 많이 죽은 구간: {bottleneck}
시장데이터: {marketData}

{format_instructions}

JSON 키:
- death_cause (짧게 한 줄)
- autopsy_report (문단/목록 가능, 하지만 마크다운 금지)
- action_plan (목록 가능, 하지만 마크다운 금지)
- needs_analysis (짧게 3~6문장)
- youtube_queries (문자열 배열 3개, 유튜브 검색어 형태)
- keywords (문자열 배열 10개, 한 단어/짧은 구)
`
    );

    // --- Debate (좌담회 텍스트, 마지막에 키워드 라인) ---
    const debatePrompt = PromptTemplate.fromTemplate(
      `아래 정보를 보고 3명의 전문가가 독설 좌담회를 열어라. (한국어/영어는 language에 맞춰라)
language: {language}
절대 마크다운 문법(**, *, #, \`\`\`)을 사용하지 말고, 평문 대화체로만 작성하라.

1) 마포구 VC (냉소적)
2) 테헤란로 창업가 (현실적)
3) 까칠한 얼리어답터 (불만 많음)

아이템: {item}
스탯: {stats}

마지막 줄은 아래 형식:
결론: 한 줄
키워드: 단어1, 단어2, 단어3, ... (10개)`
    );

    const [report, debateRes] = await Promise.all([
      generateWithFallback(
        googleKey,
        reportPrompt,
        {
          language,
          stats: JSON.stringify(safeStats),
          bottleneck: (simulation as any)?.bottleneck ?? (simulation as any)?.bottleneck_stage ?? "",
          marketData,
          format_instructions: reportParser.getFormatInstructions(),
        },
        reportParser
      ),
      generateWithFallback(googleKey, debatePrompt, {
        language,
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
    return NextResponse.json({ success: false, error: extractErrMsg(error) }, { status: 500 });
  }
}
