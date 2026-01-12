import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { StartupMCTS, type Stats } from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// ✅ 1. Vercel 캐시 끄기 (API 키 인식 필수)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ✅ 2. [핵심] 모델을 2.0 -> 1.5 -> 1.0 -> Pro 순서로 다 뒤지는 함수
async function generateWithFallback(
  apiKey: string,
  prompt: PromptTemplate,
  inputVariables: any,
  parser?: JsonOutputParser
) {
  // 🔥 형이 원한 대로 리스트 대폭 추가 (총 5개 모델 순차 시도)
  const models = [
    "gemini-2.0-flash-exp", // 1순위: 최신 2.0 (빠르고 똑똑함)
    "gemini-1.5-flash",     // 2순위: 1.5 플래시 (가성비 갑)
    "gemini-1.5-pro",       // 3순위: 1.5 프로 (고성능)
    "gemini-1.0-pro",       // 4순위: 1.0 프로 (구형)
    "gemini-pro"            // 5순위: 가장 기본 (최후의 보루, 웬만하면 됨)
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      // console.log(`🤖 시도 중인 모델: ${modelName}`); 
      
      const llm = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey,
        temperature: 0.3,
      });

      // 파서가 있으면 JSON 변환, 없으면 그냥 텍스트
      const chain = parser 
        ? prompt.pipe(llm).pipe(parser)
        : prompt.pipe(llm);

      // 실행 성공하면 바로 결과 반환하고 함수 종료!
      const result = await chain.invoke(inputVariables);
      return result;

    } catch (e) {
      console.warn(`⚠️ ${modelName} 실패... 다음 모델로 넘어갑니다.`);
      lastError = e;
      // 실패하면 루프가 돌면서 다음 모델(배열의 다음 요소)을 시도함
    }
  }

  // 5개 다 실패하면 그때 포기 선언
  throw new Error(`모든 모델(2.0~Pro)이 실패했습니다. Vercel 환경변수나 구글 API 설정을 확인해주세요. 마지막 에러: ${lastError?.message}`);
}

export async function POST(req: Request) {
  try {
    // 3. 환경변수 로딩 체크
    const tavilyKey = process.env.TAVILY_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    // 디버깅용 로그 (Vercel 로그에서 확인 가능)
    console.log("🔑 키 로딩 상태:", { 
      tavily: tavilyKey ? "OK" : "MISSING", 
      google: googleKey ? "OK" : "MISSING" 
    });

    if (!tavilyKey || !googleKey) {
      return NextResponse.json({ 
        success: false, 
        error: "API 키가 없습니다. Vercel 환경변수(Settings)를 확인해주세요." 
      }, { status: 500 });
    }

    // 4. Tavily (에러 나도 죽지 않게 처리)
    const tvly = tavily({ apiKey: tavilyKey });
    const body = await req.json();
    const { sellerInfo, buyerInfo, productInfo } = body;

    console.log("🔥 분석 시작:", productInfo.name);

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
      console.error("Tavily 검색 실패 (무시하고 진행):", e);
    }

    // 5. 스탯 분석 (Fallback 사용)
    const statsParser = new JsonOutputParser();
    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다. 다음 정보를 바탕으로 5대 스탯(0~100 정수)을 JSON으로 출력하라.
       JSON 키: product, team, strategy, marketing, consumer_needs (consumer_needs는 필수)
       정보: {info}
       시장데이터: {marketData}
       {format_instructions}`
    );
    
    // ✅ 2.0 -> 1.5 -> 1.0 순으로 시도
    const rawStats: any = await generateWithFallback(
      googleKey,
      statsPrompt,
      {
        info: `판매자:${sellerInfo}, 타겟:${buyerInfo}, 아이템:${JSON.stringify(productInfo)}`,
        marketData,
        format_instructions: statsParser.getFormatInstructions(),
      },
      statsParser
    );

    // 안전한 숫자 변환
    const safeStats: Stats = {
      product: Number(rawStats.product) || 0,
      team: Number(rawStats.team) || 0,
      strategy: Number(rawStats.strategy) || 0,
      marketing: Number(rawStats.marketing) || 0,
      consumer_needs: Number(rawStats.consumer_needs) || 0,
    };

    // 6. MCTS 시뮬레이션
    const mcts = new StartupMCTS(1200);
    const simulation = mcts.run(safeStats);

    // 7. 리포트 & 좌담회 (Fallback 사용)
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
      generateWithFallback(
        googleKey,
        debatePrompt,
        {
          item: JSON.stringify(productInfo),
          stats: JSON.stringify(safeStats)
        }
        // parser 없음 (텍스트 반환)
      )
    ]);

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
