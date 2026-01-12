"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, Terminal, TrendingUp, Users, Target, ShoppingCart, Heart } from "lucide-react";

// ❌ 문제의 라이브러리 import 제거함
// import ReactWordcloud from 'react-wordcloud';

// --- 언어 팩 (번역 데이터) ---
const translations = {
  ko: {
    title: "☠️ 스타트업 지옥 시뮬레이터",
    subtitle: "당신의 아이디어가 얼마나 빨리 망할지 팩트로 두들겨 드립니다.",
    enterBtn: "🔥 지옥불 시뮬레이션 시작",
    analyzing: "💀 뼈 때리는 중...",
    inputTitle: "지옥문 입장 신청서",
    inputDesc: "최대한 솔직하게 적으세요. 어차피 AI가 다 알아챕니다.",
    sellerInfo: "🧑‍💻 판매자(나) 정보",
    sellerPlace: "예: 30대 개발자, 영업 경험 없음",
    buyerInfo: "🎯 타겟 고객 정보",
    buyerPlace: "예: 20대 대학생, 가성비 중시",
    itemName: "📦 아이템 이름 (필수)",
    itemNamePlace: "예: AI 기반 자동 칫솔",
    itemDesc: "📝 아이템 설명 (구체적으로)",
    itemDescPlace: "상세 기능과 가격을 적어주세요.",
    traitsTitle: "🧠 창업자 DNA 자가진단 (1~10점)",
    traits: {
      obsession: "고객/문제 집착",
      speed: "실행 속도",
      ambiguity: "불확실성 내성",
      feedback: "피드백 수용력",
      resource: "리소스 감각",
      persuasion: "설득력",
      ethics: "윤리/신뢰",
      stamina: "체력/멘탈"
    },
    resultTitle: "시뮬레이션 최종 결과",
    survival: "생존 확률",
    deathCause: "주 사망 원인",
    bottleneck: "최대 병목 구간",
    needsMatch: "니즈 일치도",
    tabSummary: "📊 종합 요약",
    tabAutopsy: "🧾 부검 리포트",
    tabVoc: "🗣️ 독설 좌담회",
    statProduct: "제품 경쟁력",
    statTeam: "팀 역량",
    statStrategy: "시장 전략",
    statMarketing: "마케팅",
    statNeeds: "시장 니즈",
    funnelTitle: "죽음의 깔때기 (Death Funnel)",
    funnelDesc: "단계별 사망자 수 (높을수록 위험)",
    cloudTitle: "☁️ 핵심 키워드 클라우드",
    autopsyTitle: "🧾 상세 부검 결과",
    needsTitle: "🎯 소비자 니즈 팩폭",
    actionTitle: "🩸 최후의 발악 (Action Plan)",
    vocTitle: "🗣️ 지옥의 독설 좌담회 전문",
    retryBtn: "🔄 다시하기"
  },
  en: {
    title: "☠️ Startup Hell Simulator",
    subtitle: "We brutally simulate how fast your idea will fail.",
    enterBtn: "🔥 Start Hell Simulation",
    analyzing: "💀 Roasting your idea...",
    inputTitle: "Hell Gate Application",
    inputDesc: "Be honest. AI knows everything anyway.",
    sellerInfo: "🧑‍💻 Seller (You)",
    sellerPlace: "e.g. 30yo Dev, No sales exp",
    buyerInfo: "🎯 Target Audience",
    buyerPlace: "e.g. College students, Price sensitive",
    itemName: "📦 Product Name (Required)",
    itemNamePlace: "e.g. AI Toothbrush",
    itemDesc: "📝 Description (Specific)",
    itemDescPlace: "Features, Price, How it works...",
    traitsTitle: "🧠 Founder DNA Test (1-10)",
    traits: {
      obsession: "Customer Obsession",
      speed: "Execution Speed",
      ambiguity: "Ambiguity Tolerance",
      feedback: "Feedback Acceptance",
      resource: "Resourcefulness",
      persuasion: "Persuasion",
      ethics: "Ethics/Trust",
      stamina: "Stamina/Grit"
    },
    resultTitle: "Final Simulation Result",
    survival: "Survival Rate",
    deathCause: "Main Cause of Death",
    bottleneck: "Major Bottleneck",
    needsMatch: "Needs Match",
    tabSummary: "📊 Summary",
    tabAutopsy: "🧾 Autopsy Report",
    tabVoc: "🗣️ Toxic Debate",
    statProduct: "Product",
    statTeam: "Team",
    statStrategy: "Strategy",
    statMarketing: "Marketing",
    statNeeds: "Market Needs",
    funnelTitle: "Death Funnel",
    funnelDesc: "Deaths per stage (Higher is worse)",
    cloudTitle: "☁️ Key Word Cloud",
    autopsyTitle: "🧾 Detailed Autopsy",
    needsTitle: "🎯 Needs Reality Check",
    actionTitle: "🩸 Last Ditch Effort (Action Plan)",
    vocTitle: "🗣️ The Toxic Panel Debate",
    retryBtn: "🔄 Try Again"
  }
};

// 타입 정의
type AnalysisResult = {
  success: boolean;
  stats: {
    product: number;
    team: number;
    strategy: number;
    marketing: number;
    consumer_needs: number;
  };
  simulation: {
    survival_rate: number;
    death_counts: Record<string, number>;
    bottleneck_stage: string;
  };
  report: {
    death_cause: string;
    autopsy_report: string;
    action_plan: string;
    needs_analysis: string;
    keywords: string[];
  };
  debate: string;
  pastCases: Array<{ title: string; url: string; content: string }>;
  error?: string;
};

type FounderTraits = {
  obsession: number;
  speed: number;
  ambiguity: number;
  feedback: number;
  resource: number;
  persuasion: number;
  ethics: number;
  stamina: number;
};

export default function Home() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko'); // 언어 상태
  const t = translations[lang]; // 현재 언어 팩

  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // 입력 폼 상태
  const [sellerInfo, setSellerInfo] = useState("");
  const [buyerInfo, setBuyerInfo] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");

  const [founderTraits, setFounderTraits] = useState<FounderTraits>({
    obsession: 5, speed: 5, ambiguity: 5, feedback: 5,
    resource: 5, persuasion: 5, ethics: 5, stamina: 5
  });

  const handleTraitChange = (trait: keyof FounderTraits, value: number) => {
    setFounderTraits(prev => ({ ...prev, [trait]: value }));
  };

  const runAnalysis = async () => {
    if (!productName || !productDesc) {
      alert(lang === 'ko' ? "아이템 이름과 설명을 입력해주세요." : "Please enter product name and description.");
      return;
    }

    setLoading(true);
    setShowResults(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          sellerInfo,
          buyerInfo,
          productInfo: { name: productName, desc: productDesc },
          founderTraits,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        setShowResults(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  // 헬퍼 컴포넌트
  const StatBar = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold items-center">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClass}`} /> {label}
        </div>
        <span className={colorClass}>{value}/100</span>
      </div>
      <Progress value={value} className={`h-3 ${colorClass.replace('text', 'bg')}/20`} indicatorColor={colorClass.replace('text-','')} />
    </div>
  );

  const getFunnelChart = (simulation: any) => {
    const stages = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"];
    const maxDeaths = Math.max(...Object.values(simulation.death_counts) as number[]);

    return (
      <div className="space-y-3 mt-4">
        {stages.map((stage) => {
          const deaths = simulation.death_counts[stage] || 0;
          const isBottleneck = stage === simulation.bottleneck_stage;
          const width = maxDeaths === 0 ? 0 : (deaths / maxDeaths) * 100;

          return (
            <div key={stage} className="flex items-center gap-2 text-sm">
               <span className={`w-20 text-right font-bold ${isBottleneck ? 'text-red-500' : 'text-zinc-400'}`}>
                {stage}
              </span>
              <div className="flex-1 h-6 bg-zinc-800 rounded-sm overflow-hidden relative">
                <div
                  className={`h-full ${isBottleneck ? "bg-red-600" : "bg-zinc-600"
                    } transition-all duration-500`}
                  style={{ width: `${width}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-end px-2 text-xs font-bold text-white/80">
                   {deaths > 0 ? `☠️ ${deaths}` : ""}
                </span>
              </div>
            </div>
          );
        })}
         <p className="text-center text-xs text-zinc-500 mt-2">{t.funnelDesc}</p>
      </div>
    );
  };

  // ✅ [수정됨] 라이브러리 없이 만드는 워드클라우드 (Tag Cloud)
  // 단순히 텍스트를 나열하되, 랜덤한 크기와 색상을 부여해서 구름처럼 보이게 함
  const TagCloud = ({ keywords }: { keywords: string[] }) => {
    if (!keywords || keywords.length === 0) return <div className="text-zinc-500">데이터 분석 중...</div>;

    const getStyle = (i: number) => {
        const sizes = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl font-bold"];
        const colors = ["text-red-400", "text-orange-400", "text-zinc-300", "text-blue-400", "text-white"];
        // 랜덤처럼 보이지만 i 값에 따라 고정된 스타일 (SSR 매칭 문제 방지)
        return `${sizes[i % sizes.length]} ${colors[i % colors.length]}`;
    };

    return (
        <div className="flex flex-wrap gap-4 justify-center items-center h-full p-4">
            {keywords.map((word, i) => (
                <span key={i} className={`${getStyle(i)} transition-all hover:scale-110 cursor-default px-2 py-1 bg-zinc-800/30 rounded-lg`}>
                    {word}
                </span>
            ))}
        </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        
        {/* 언어 선택 버튼 */}
        <div className="absolute top-0 right-0 flex gap-2">
          <Button 
            variant={lang === 'ko' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setLang('ko')}
            className={lang === 'ko' ? "bg-red-600 hover:bg-red-700" : "border-zinc-700 text-zinc-400"}
          >
            🇰🇷 KO
          </Button>
          <Button 
            variant={lang === 'en' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setLang('en')}
            className={lang === 'en' ? "bg-blue-600 hover:bg-blue-700" : "border-zinc-700 text-zinc-400"}
          >
            🇺🇸 EN
          </Button>
        </div>

        {/* 헤더 */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tight">
            {t.title}
          </h1>
          <p className="text-zinc-400 text-lg">
            {t.subtitle}
          </p>
        </div>

        {/* 입력 화면 */}
        {!showResults && (
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Terminal className="w-6 h-6 text-red-500" /> {t.inputTitle}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {t.inputDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">{t.sellerInfo}</label>
                  <Input placeholder={t.sellerPlace} value={sellerInfo} onChange={(e) => setSellerInfo(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">{t.buyerInfo}</label>
                  <Input placeholder={t.buyerPlace} value={buyerInfo} onChange={(e) => setBuyerInfo(e.target.value)} className="bg-zinc-800 border-zinc-700" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-red-400">{t.itemName}</label>
                  <Input placeholder={t.itemNamePlace} value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-zinc-800 border-zinc-700 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-red-400">{t.itemDesc}</label>
                  <Textarea placeholder={t.itemDescPlace} value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="bg-zinc-800 border-zinc-700 min-h-[100px]" />
                </div>
              </div>

              {/* 창업자 특성 슬라이더 */}
              <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2">
                    {t.traitsTitle}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    {Object.keys(t.traits).map((key) => (
                        <div key={key} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <label className="font-bold text-zinc-300">{t.traits[key as keyof typeof t.traits]}</label>
                                <span className="text-red-400 font-bold">{founderTraits[key as keyof FounderTraits]}</span>
                            </div>
                            <input
                                type="range" min="1" max="10" step="1" 
                                value={founderTraits[key as keyof FounderTraits]}
                                onChange={(e) => handleTraitChange(key as keyof FounderTraits, parseInt(e.target.value))}
                                className="w-full accent-red-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
              </div>

              <Button onClick={runAnalysis} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold py-6 text-lg">
                {loading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> {t.analyzing}</> : t.enterBtn}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 결과 화면 */}
        {showResults && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 상단 요약 */}
            <Card className="bg-zinc-900/80 border-red-900/30 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
                 <CardHeader className="pb-2 relative z-10">
                     <CardTitle className="flex items-center gap-2 text-red-400">
                         <AlertTriangle className="h-6 w-6 text-red-500" /> {t.resultTitle}
                     </CardTitle>
                 </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">💀 {t.survival}</p>
                        <p className="text-4xl font-extrabold text-red-500">{result.simulation.survival_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">⚰️ {t.deathCause}</p>
                        <Badge variant="destructive" className="text-sm px-3 py-1">{result.report.death_cause}</Badge>
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">🧗 {t.bottleneck}</p>
                        <p className="text-xl font-bold text-white">{result.simulation.bottleneck_stage}</p>
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">🎯 {t.needsMatch}</p>
                        <p className="text-2xl font-bold text-orange-400">{result.stats.consumer_needs}</p>
                    </div>
                </CardContent>
            </Card>

            {/* 탭 네비게이션 */}
            <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50 p-1">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-red-600 text-white font-bold">{t.tabSummary}</TabsTrigger>
                    <TabsTrigger value="autopsy" className="data-[state=active]:bg-red-600 text-white font-bold">{t.tabAutopsy}</TabsTrigger>
                    <TabsTrigger value="voc" className="data-[state=active]:bg-red-600 text-white font-bold">{t.tabVoc}</TabsTrigger>
                </TabsList>

                {/* 탭 1: 종합 요약 */}
                <TabsContent value="summary" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card className="bg-zinc-900/50 border-zinc-800 h-full">
                            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="w-5 h-5 text-blue-400"/> 5 Stats</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <StatBar label={t.statProduct} value={result.stats.product} icon={ShoppingCart} colorClass="text-blue-400" />
                                <StatBar label={t.statTeam} value={result.stats.team} icon={Users} colorClass="text-green-400" />
                                <StatBar label={t.statStrategy} value={result.stats.strategy} icon={Target} colorClass="text-purple-400" />
                                <StatBar label={t.statMarketing} value={result.stats.marketing} icon={TrendingUp} colorClass="text-yellow-400" />
                                <StatBar label={t.statNeeds} value={result.stats.consumer_needs} icon={Heart} colorClass="text-red-400" />
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-zinc-900/50 border-zinc-800 h-full">
                             <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="w-5 h-5 text-red-500"/> {t.funnelTitle}</CardTitle></CardHeader>
                             <CardContent>{getFunnelChart(result.simulation)}</CardContent>
                        </Card>
                    </div>

                    {/* 워드클라우드 (라이브러리 제거 -> 커스텀 컴포넌트) */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader><CardTitle className="text-lg font-bold">{t.cloudTitle}</CardTitle></CardHeader>
                        <CardContent className="min-h-[250px] flex items-center justify-center bg-zinc-950/30 rounded-lg overflow-hidden">
                             {/* ✅ 여기만 바뀜! 직접 만든 TagCloud 사용 */}
                             <TagCloud keywords={result.report.keywords} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 탭 2: 부검 리포트 */}
                <TabsContent value="autopsy" className="space-y-6 mt-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-zinc-900/50 border-red-900/50">
                            <CardHeader><CardTitle className="text-lg font-bold text-red-400">{t.autopsyTitle}</CardTitle></CardHeader>
                            <CardContent className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {result.report.autopsy_report}
                            </CardContent>
                        </Card>
                         <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader><CardTitle className="text-lg font-bold text-orange-400">{t.needsTitle}</CardTitle></CardHeader>
                             <CardContent className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                "{result.report.needs_analysis}"
                            </CardContent>
                        </Card>
                     </div>
                    <Card className="bg-red-950/30 border-red-900/50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-red-200">{t.actionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-red-100 p-6 bg-red-950/20 rounded-b-xl text-base font-medium whitespace-pre-wrap">
                            {result.report.action_plan}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 탭 3: 독설 좌담회 */}
                <TabsContent value="voc" className="mt-6">
                     <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
                        <CardHeader><CardTitle className="text-xl font-bold">{t.vocTitle}</CardTitle></CardHeader>
                        <CardContent>
                            <div className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-800/50 text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                                 {result.debate}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center pt-8">
              <Button variant="outline" onClick={() => setShowResults(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8 py-4">
                 {t.retryBtn}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
