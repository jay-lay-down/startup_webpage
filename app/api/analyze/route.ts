import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { StartupMCTS, type Stats } from "@/lib/mcts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// ✅ Vercel 캐시 끄기
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ✅ 좀비 실행기 (모델 돌려막기)
async function generateWithFallback(
  apiKey: string,
  prompt: PromptTemplate,
  inputVariables: any,
  parser?: JsonOutputParser
) {
  const models = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro"
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      const llm = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey,
        temperature: 0.4,
      });

      const chain = parser 
        ? prompt.pipe(llm).pipe(parser)
        : prompt.pipe(llm);

      const result = await chain.invoke(inputVariables);
      return result;

    } catch (e: any) {
      console.warn(`⚠️ 모델 실패 (${modelName}):`, e?.message || e);
      lastError = e;
    }
  }
  throw new Error(`모든 모델 실행 실패. API 키 확인 요망. Last: ${lastError?.message}`);
}

export async function POST(req: Request) {
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    if (!tavilyKey || !googleKey) {
      return NextResponse.json({ 
        success: false, 
        error: "API 키가 없습니다. Vercel 환경변수를 확인해주세요." 
      }, { status: 500 });
    }

    const body = await req.json();
    // ✅ 언어 설정 받기 (기본값: ko)
    const { sellerInfo, buyerInfo, productInfo, founderTraits, language = 'ko' } = body;

    // AI에게 내릴 언어 지시어 설정
    const langInstruction = language === 'en' 
      ? "Write ALL responses in English." 
      : "모든 답변을 반드시 '한국어'로 작성해라.";

    console.log(`🔥 분석 시작 (${language}):`, productInfo.name);

    // 1. Tavily 검색
    const tvly = tavily({ apiKey: tavilyKey });
    let marketData = "No market data";
    let pastCases: any[] = [];
    
    try {
      // 검색어는 언어에 맞게 변형
      const query = language === 'en' 
        ? `${productInfo.name} market failure cases competitors complaints`
        : `${productInfo.name} 시장 반응 실패 사례 경쟁사 불만`;

      const searchResult = await tvly.search(query, {
        searchDepth: "advanced",
        maxResults: 4,
      });
      marketData = searchResult.results.map((r) => `- ${r.title}: ${r.content.slice(0, 300)}...`).join("\n");
      pastCases = searchResult.results.map(r => ({ title: r.title, url: r.url, content: r.content }));
    } catch (e) {
      console.error("Tavily Error:", e);
    }

    // 2. 스탯 분석
    const statsParser = new JsonOutputParser();
    const statsPrompt = PromptTemplate.fromTemplate(
      `You are a cynical startup validator.
       Evaluate 5 stats (0-100) based on the input.
       Higher 'Founder Traits' score should positively impact 'Team' and 'Strategy'.
       
       Input:
       - Seller: {sellerInfo}
       - Target: {buyerInfo}
       - Product: {productInfo}
       - Founder Traits (1-10): {founderTraits}
       - Market Data: {marketData}
       
       {format_instructions}
       JSON Keys: product, team, strategy, marketing, consumer_needs`
    );
    
    const rawStats: any = await generateWithFallback(
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
      product: Number(rawStats.product) || 0,
      team: Number(rawStats.team) || 0,
      strategy: Number(rawStats.strategy) || 0,
      marketing: Number(rawStats.marketing) || 0,
      consumer_needs: Number(rawStats.consumer_needs) || 0,
    };

    // 3. MCTS 시뮬레이션
    const mcts = new StartupMCTS(1500);
    const simulation = mcts.run(safeStats);

    // 4. 리포트 & 좌담회 (✅ 언어 변수 적용)
    const reportParser = new JsonOutputParser();
    const reportPrompt = PromptTemplate.fromTemplate(
      `You are a cynical VC. Write a startup autopsy report.
       **IMPORTANT: {langInstruction}**

       JSON Keys: 
       - death_cause (Short reason for failure)
       - autopsy_report (Detailed analysis)
       - action_plan (Desperate measures to survive)
       - needs_analysis (Harsh reality check on consumer needs)
       - keywords (Array of 10 strings representing the item, e.g., "Expensive", "Useless")

       Stats: {stats}
       Bottleneck: {bottleneck}
       Market Data: {marketData}
       {format_instructions}`
    );

    const debatePrompt = PromptTemplate.fromTemplate(
      `Conduct a cynical panel discussion with 3 experts about this item.
       **IMPORTANT: {langInstruction}**
       
       Panelists:
       1) Cynical VC (Cold logic)
       2) Realistic Founder (Experienced, tired)
       3) Picky Early Adopter (Hates gimmicks)

       Item: {item}
       Stats: {stats}
       
       Format: Conversation style.
       End with "Conclusion: One sentence summary".`
    );

    // 병렬 실행
    const [report, debateRes] = await Promise.all([
      generateWithFallback(
        googleKey,
        reportPrompt,
        {
          langInstruction, // 언어 지시어 전달
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
          langInstruction, // 언어 지시어 전달
          item: JSON.stringify(productInfo),
          stats: JSON.stringify(safeStats)
        }
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
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
