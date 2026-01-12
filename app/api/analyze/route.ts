import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { StartupMCTS, type Stats } from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // ✅ [핵심 수정] 도구 초기화를 함수 '안'으로 옮겼습니다.
    // 이제 빌드 타임에 실행되지 않아서 에러가 안 납니다.
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
    });

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

    // 2. Gemini 스탯 분석
    const statsParser = new JsonOutputParser();
    const statsPrompt = PromptTemplate.fromTemplate(
      `너는 냉소적인 스타트업 검증관이다. 다음 정보를 바탕으로 5대 스탯(0~100 정수)을 JSON으로 출력하라.
       JSON 키: product, team, strategy, marketing, consumer_needs (consumer_needs는 필수)
       정보: {info}
       시장데이터: {marketData}
       {format_instructions}`
    );
    
    const statsChain = statsPrompt.pipe(llm).pipe(statsParser);
    const rawStats = await statsChain.invoke({
      info: `판매자:${sellerInfo}, 타겟:${buyerInfo}, 아이템:${JSON.stringify(productInfo)}`,
      marketData,
      format_instructions: statsParser.getFormatInstructions(),
    });

    // 안전한 스탯 변환 (방탄 코드 유지)
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

    // 4. 부검 리포트 & 좌담회
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

    const [report, debateRes] = await Promise.all([
      reportPrompt.pipe(llm).pipe(reportParser).invoke({
        stats: JSON.stringify(safeStats),
        bottleneck: simulation.bottleneck,
        marketData,
        format_instructions: reportParser.getFormatInstructions(),
      }),
      debatePrompt.pipe(llm).invoke({
        item: JSON.stringify(productInfo),
        stats: JSON.stringify(safeStats)
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: safeStats,
      simulation,
      report,
      debate: debateRes.content,
      pastCases
    });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
