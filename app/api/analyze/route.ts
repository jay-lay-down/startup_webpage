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

// ✅ 여기 제네릭 constraint를 Record<string, any> -> object 로 완화 (TS 에러 방지)
async function generateJsonWithFallback<T extends object>(
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

function toInt0to100(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ✅ 마크다운 찌꺼기 제거(특히 ** 때문에 짜증나는 케이스 방지)
function stripMarkdownArtifacts(s: any): string {
  const text = String(s ?? "");
  return text
    .replace(/\*\*/g, "")          // ** 제거
    .replace(/`+/g, "")            // 백틱 제거
    .replace(/^\s*[-*]\s+/gm, "")  // - bullet 제거
    .replace(/^#+\s*/gm, "")       // # heading 제거
    .trim();
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

    console.log("🔥 분석 시작:", productInfo.name);

    // --- Tavily 검색 ---
    const tvly = tavily({ apiKey: tavilyKey });
    let marketData = "시장 데이터 없음";
    let pastCases: Array<{ title: string; url: string; content: string }> = [];

    try {
      const q = `${productInfo.name} 실패 사례 경쟁사 리뷰 불만 대체재`;
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

    // --- Stats JSON ---
    // ✅ Stats 타입이 이제 { product, founder, strategy, marketing, consumer_needs } 임 (mcts.ts 기준)
    const statsParser = new JsonOutputParser<Stats>();

    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다.
아래 정보와 시장데이터를 기반으로 5대 스탯(0~100 정수)을 JSON으로 출력하라.

중요:
- 초기 스타트업은 팀이 없을 수 있다. 따라서 'team'을 평가하지 않는다.
- 대신 창업자 개인 역량을 'founder' 점수로 평가한다.
- founder 점수는 아래 '창업자 특성(1~10)'을 강하게 반영하라.
- strategy 점수에도 창업자 특성(실행력/불확실성 내성/설득력/리소스 감각)을 반영하라.

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
JSON 키: product, founder, strategy, marketing, consumer_needs`
    );

    const rawStats = await generateJsonWithFallback<Stats>(
      googleKey,
      statsPrompt,
      {
        sellerInfo,
        buyerInfo,
        productInfo: JSON.stringify(productInfo),
        founderTraits: JSON.stringify(founderTraits ?? {}),
        marketData,
        format_instructions: statsParser.getFormatInstructions(),
      },
      statsParser,
      0.3
    );

    const safeStats: Stats = {
      product: toInt0to100((rawStats as any).product),
      founder: toInt0to100((rawStats as any).founder),
      strategy: toInt0to100((rawStats as any).strategy),
      marketing: toInt0to100((rawStats as any).marketing),
      consumer_needs: toInt0to100((rawStats as any).consumer_needs),
    };

    // --- MCTS ---
    const mcts = new StartupMCTS(1500);
    const simulation = mcts.run(safeStats);

    // --- Report JSON (유튜브 추천 쿼리 + 키워드 포함) ---
    type ReportShape = {
      death_cause: string;
      autopsy_report: string;
      action_plan: string;
      needs_analysis: string;
      youtube_queries: string[];
      keywords: string[];
    };

    const reportParser = new JsonOutputParser<ReportShape>();
    const reportPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 VC다. 아래 정보를 바탕으로 '부검 리포트'를 JSON으로 작성하라.

요구 JSON 키:
- death_cause (짧게)
- autopsy_report (줄글)
- needs_analysis (줄글)
- action_plan (번호 리스트를 "1) ...\\n2) ..." 형태로. 마크다운 금지. **, *, # 같은 기호 쓰지 마.)
- youtube_queries (배열, string 3개: "아이템/시장/실패사례"로 유튜브 검색할 문장)
- keywords (배열, string 10개: 워드클라우드용 핵심 키워드)

입력:
- 스탯: {stats}
- 가장 많이 죽은 구간: {bottleneck}
- 시장데이터: {marketData}

주의:
- JSON만 출력
- action_plan에 마크다운 금지(특히 ** 사용 금지)
- keywords는 "단어/짧은 구" 중심

{format_instructions}`
    );

    const reportRaw = await generateJsonWithFallback<ReportShape>(
      googleKey,
      reportPrompt,
      {
        stats: JSON.stringify(safeStats),
        bottleneck: (simulation as any).bottleneck_stage ?? (simulation as any).bottleneck ?? "",
        marketData,
        format_instructions: reportParser.getFormatInstructions(),
      },
      reportParser,
      0.35
    );

    // ✅ action_plan에서 마크다운 찌꺼기 2차 제거
    const report: ReportShape = {
      ...reportRaw,
      action_plan: stripMarkdownArtifacts(reportRaw.action_plan),
      autopsy_report: String(reportRaw.autopsy_report ?? ""),
      needs_analysis: String(reportRaw.needs_analysis ?? ""),
      death_cause: String(reportRaw.death_cause ?? ""),
      youtube_queries: Array.isArray(reportRaw.youtube_queries) ? reportRaw.youtube_queries.slice(0, 3) : [],
      keywords: Array.isArray(reportRaw.keywords) ? reportRaw.keywords.slice(0, 10) : [],
    };

    // --- Debate TEXT ---
    const debateLangInstr =
      language === "en"
        ? "Write the conversation in natural English."
        : "한국어 대화체로 작성.";

    const debatePrompt = PromptTemplate.fromTemplate(
      `아래 정보를 보고 3명의 전문가가 독설 좌담회를 열어라.
${debateLangInstr}

1) 마포구 VC (냉소적) 2) 테헤란로 창업가 (현실적) 3) 까칠한 얼리어답터 (불만 많음)

아이템: {item}
스탯: {stats}
시장데이터 요약: {marketData}

형식:
- 대화체로 줄바꿈
- 마지막 줄에 "결론: 한 줄"로 끝내라`
    );

    const debate = await generateTextWithFallback(
      googleKey,
      debatePrompt,
      {
        item: JSON.stringify(productInfo),
        stats: JSON.stringify(safeStats),
        marketData,
      },
      0.45
    );

    return NextResponse.json({
      success: true,
      stats: safeStats,     // ✅ founder 포함
      simulation,           // ✅ survival_rate / death_counts / bottleneck_stage 포함
      report,               // ✅ youtube_queries + keywords 유지
      debate,
      pastCases,            // ✅ 유사/실패사례 링크 유지
    });
  } catch (error: any) {
    console.error("Server Error:", extractErrMsg(error));
    return NextResponse.json({ success: false, error: extractErrMsg(error) }, { status: 500 });
  }
}
