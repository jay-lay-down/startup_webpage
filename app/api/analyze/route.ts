import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { StartupMCTS, type Stats } from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// ✅ 1. Vercel 캐시 끄기 (API 키 인식 필수)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// --------------------------------------------------------------------------
// ✅ [핵심] 복잡한 조회 없이, 준비된 모델 5개를 순서대로 실행하는 '좀비 실행기'
// --------------------------------------------------------------------------
async function generateWithFallback(
  apiKey: string,
  prompt: PromptTemplate,
  inputVariables: any,
  parser?: JsonOutputParser
) {
  // 시도할 모델 순서 (최신 -> 구형 순)
  // 리스트 조회 권한이 없어도 작동하도록 하드코딩해서 에러 원천 차단
  const models = [
    "gemini-2.0-flash-exp", // 1순위: 최신 2.0
    "gemini-1.5-flash",     // 2순위: 가성비 갑
    "gemini-1.5-pro",       // 3순위: 고성능
    "gemini-1.0-pro",       // 4순위: 안정적
    "gemini-pro"            // 5순위: 최후의 보루
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      const llm = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey,
        temperature: 0.4, // 창의성 약간 추가
      });

      // 파서 유무에 따라 체인 연결
      const chain = parser 
        ? prompt.pipe(llm).pipe(parser)
        : prompt.pipe(llm);

      // 실행! 성공하면 바로 결과 리턴하고 함수 종료 (에러 안 나면 여기서 끝)
      const result = await chain.invoke(inputVariables);
      return result;

    } catch (e: any) {
      console.warn(`⚠️ 모델 실패 (${modelName}): 넘어갑니다.`);
      lastError = e;
      // 실패하면 for loop가 돌면서 다음 모델을 자동으로 시도함
    }
  }

  // 5개 다 실패하면 그때 에러 던짐
  throw new Error(`모든 모델 실행 실패. API 키를 확인해주세요. 마지막 에러: ${lastError?.message}`);
}

// --------------------------------------------------------------------------
// API 핸들러
// --------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    if (!tavilyKey || !googleKey) {
      return NextResponse.json({ 
        success: false, 
        error: "API 키가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요." 
      }, { status: 500 });
    }

    const body = await req.json();
    // 프론트엔드에서 보낸 데이터 받기
    const { sellerInfo, buyerInfo, productInfo, founderTraits } = body;

    console.log("🔥 분석 시작:", productInfo.name);

    // 1. Tavily 검색 (에러 나도 죽지 않게 처리)
    const tvly = tavily({ apiKey: tavilyKey });
    let marketData = "시장 데이터 없음";
    let pastCases: any[] = [];
    
    try {
      const searchResult = await tvly.search(`${productInfo.name} 시장 반응 실패 사례 경쟁사 불만`, {
        searchDepth: "advanced",
        maxResults: 4,
      });
      marketData = searchResult.results.map((r) => `- ${r.title}: ${r.content.slice(0, 300)}...`).join("\n");
      pastCases = searchResult.results.map(r => ({ title: r.title, url: r.url, content: r.content }));
    } catch (e) {
      console.error("Tavily Error:", e);
    }

    // 2. 스탯 분석 (창업자 특성 반영 + Fallback 적용)
    const statsParser = new JsonOutputParser();
    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다.
       입력된 정보와 '창업자 특성(10점 만점)'을 반영하여 5대 스탯(0~100)을 JSON으로 평가하라.
       특히 '창업자 특성' 점수가 높으면 Team과 Strategy 점수에 가산점을, 낮으면 감점하라.

       정보: {info}
       창업자 특성: {founderTraits}
       시장데이터: {marketData}
       
       {format_instructions}
       JSON 키: product, team, strategy, marketing, consumer_needs`
    );
    
    // ✅ 좀비 실행기로 호출 (모델 5개 돌려막기)
    const rawStats: any = await generateWithFallback(
      googleKey,
      statsPrompt,
      {
        info: `판매자:${sellerInfo}, 타겟:${buyerInfo}, 아이템:${JSON.stringify(productInfo)}`,
        founderTraits: JSON.stringify(founderTraits),
        marketData,
        format_instructions: statsParser.getFormatInstructions(),
      },
      statsParser
    );

    const safeStats: Stats = {
      product: Number(rawStats.product) || 0,
      team: Number(rawStats.team) || 0,
      strategy: Number(rawStats.strategy) || 0,
      marketing: Number(rawStats.marketing) || 0,
      consumer_needs: Number(rawStats.consumer_needs) || 0,
    };

    // 3. MCTS 시뮬레이션
    const mcts = new StartupMCTS(1500);
    const simulation = mcts.run(safeStats);

    // 4. 리포트 & 좌담회 (키워드 추출 포함 + Fallback 적용)
    const reportParser = new JsonOutputParser();
    const reportPrompt = PromptTemplate.fromTemplate(
      `냉소적인 VC로서 부검 리포트를 JSON으로 작성해라.
       JSON 키: death_cause, autopsy_report, action_plan, needs_analysis, keywords(배열 string 10개)
       
       keywords 설명: 이 아이템을 표현하는 핵심 단어 10개 (예: "고비용", "디자인", "불필요", "AI")
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
        // parser 없음 -> 텍스트 반환
      )
    ]);

    // 좌담회 결과 처리 (객체 or 문자열)
    const debateContent = typeof debateRes === 'string' ? debateRes : (debateRes as any).content;

    return NextResponse.json({
      success: true,
      stats: safeStats,
      simulation,
      report, // 여기에 keywords 포함됨
      debate: debateContent,
      pastCases
    });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
