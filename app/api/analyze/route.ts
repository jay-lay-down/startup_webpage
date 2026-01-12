import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { StartupMCTS, type Stats } from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

export const maxDuration = 60;

// ✅ [핵심] 실패하면 다음 모델을 부르는 '무한 도전' 함수
async function generateWithFallback(
  apiKey: string,
  preferredModel: string, // 유저가 원했던 모델 (혹은 기본값)
  promptTemplate: PromptTemplate,
  inputVariables: any,
  parser?: JsonOutputParser
) {
  // 후보 명단: 1순위(선택) -> 2순위(gemini-pro/국밥) -> 3순위(1.5-flash/빠름)
  const candidates = Array.from(new Set([
    preferredModel, 
    "gemini-pro", 
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ])).filter(Boolean); // 빈 값 제거

  let lastError: any = null;

  for (const modelName of candidates) {
    try {
      // console.log(`🤖 모델 시도: ${modelName}`); // 디버깅용 로그
      
      const llm = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey,
        temperature: 0.3,
      });

      // 파서가 있으면 파서까지 연결, 없으면(좌담회 등) 그냥 텍스트 출력
      const chain = parser 
        ? promptTemplate.pipe(llm).pipe(parser)
        : promptTemplate.pipe(llm);

      const result = await chain.invoke(inputVariables);
      return result; // 성공하면 바로 리턴!

    } catch (e) {
      console.warn(`⚠️ 모델 에러 (${modelName}): 넘어갑니다.`);
      lastError = e;
      continue; // 에러 나면 다음 모델로
    }
  }

  // 다 해봤는데 안 되면 에러 던짐
  throw lastError;
}


export async function POST(req: Request) {
  try {
    // 0. 도구 준비 (함수 내부에서 초기화 -> 빌드 에러 방지)
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    
    // API 키 가져오기 (환경변수)
    const googleApiKey = process.env.GOOGLE_API_KEY || "";
    if (!googleApiKey) throw new Error("GOOGLE_API_KEY가 없습니다.");

    const body = await req.json();
    const { sellerInfo, buyerInfo, productInfo } = body;

    console.log("🔥 분석 시작:", productInfo.name);

    // 1. Tavily 시장 조사
    let marketData = "시장 데이터 없음";
    let pastCases: any[] = [];
    
    try {
      const searchResult = await tvly.search(`${productInfo.name} 시장 반응 실패 사례 경쟁사 불만`, {
        searchDepth: "advanced",
        maxResults: 5,
      });
      marketData = searchResult.results.map((r) => `- ${r.title}: ${r.content}`).join("\n");
      pastCases = searchResult.results.map(r => ({ title: r.title, url: r.url, content: r.content }));
    } catch (e) {
      console.error("Tavily Error:", e);
    }

    // 2. Gemini 스탯 분석 (Fallback 적용)
    const statsParser = new JsonOutputParser();
    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다. 다음 정보를 바탕으로 5대 스탯(0~100 정수)을 JSON으로 출력하라.
       JSON 키: product, team, strategy, marketing, consumer_needs (consumer_needs는 필수)
       정보: {info}
       시장데이터: {marketData}
       {format_instructions}`
    );
    
    // ✅ 안전한 실행기로 호출
    const rawStats: any = await generateWithFallback(
      googleApiKey,
      "gemini-1.5-flash", // 1순위 시도
      statsPrompt,
      {
        info: `판매자:${sellerInfo}, 타겟:${buyerInfo}, 아이템:${JSON.stringify(productInfo)}`,
        marketData,
        format_instructions: statsParser.getFormatInstructions(),
      },
      statsParser
    );

    // 안전한 숫자 변환 (방탄 코드)
    const safeStats: Stats = {
      product: Number(rawStats.product) || 0,
      team: Number(rawStats.team) || 0,
      strategy: Number(rawStats.strategy) || 0,
      marketing: Number(rawStats.marketing) || 0,
      consumer_needs: Number(rawStats.consumer_needs) || 0,
    };

    // 3. MCTS 시뮬레이션
    const mcts = new StartupMCTS(1200);
    const simulation = mcts.run(safeStats);

    // 4. 부검 리포트 & 좌담회 (Fallback 적용)
    const reportParser = new JsonOutputParser();
    const reportPrompt = PromptTemplate.fromTemplate(
      `냉소적인 VC로서 부검 리포트를 JSON으로 작성해라.
       JSON 키: death_cause, autopsy_report, action_plan, needs_analysis, youtube_queries(배열 string 3개)
       스탯: {stats}
       가장 많이 죽은 구간: {bottleneck}
       시장데이터: {marketData}
       {format_instructions}`
    );

    const debatePrompt = PromptTemplate.fromTemplate(
      `아래 정보를 보고 3명의 전문가가 독설 좌담회를 열어라. 한국어 대화체로 작성.
       1) 마포구 VC (냉소적) 2) 테헤란로 창업가 (현실적) 3) 까칠한 얼리어답터 (불만 많음)
       아이템: {item}
       스탯: {stats}
       마지막에 "결론: 한 줄" 포함.`
    );

    // 병렬 실행
    const [report, debateRes] = await Promise.all([
      // 리포트 생성 (JSON 파서 사용)
      generateWithFallback(
        googleApiKey,
        "gemini-1.5-flash",
        reportPrompt,
        {
          stats: JSON.stringify(safeStats),
          bottleneck: simulation.bottleneck,
          marketData,
          format_instructions: reportParser.getFormatInstructions(),
        },
        reportParser
      ),
      // 좌담회 생성 (파서 없음 -> 텍스트 반환)
      generateWithFallback(
        googleApiKey,
        "gemini-1.5-flash",
        debatePrompt,
        {
          item: JSON.stringify(productInfo),
          stats: JSON.stringify(safeStats)
        }
        // parser 없음
      )
    ]);

    // LangChain 결과가 객체(.content)로 올 수도 있고 string으로 올 수도 있어서 처리
    const debateContent = typeof debateRes === 'string' ? debateRes : (debateRes as any).content;

    return NextResponse.json({
      success: true,
      stats: safeStats,
      simulation,
      report,
      debate: debateContent,
      pastCases
    });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
