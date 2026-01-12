// app/page.tsx
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
import ReactWordcloud from 'react-wordcloud';

// --- 타입 정의 ---
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
  };
  debate: string;
  pastCases: Array<{ title: string; url: string; content: string }>;
  error?: string;
};

// ✅ 창업자 특성 타입 정의
type FounderTraits = {
  obsession: number; // 집착
  speed: number; // 속도
  ambiguity: number; // 불확실성 내성
  feedback: number; // 피드백 수용력
  resource: number; // 리소스 감각
  persuasion: number; // 설득력
  ethics: number; // 윤리/신뢰
  stamina: number; // 체력/지속가능성
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false); // 결과 화면 표시 여부
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // 입력 폼 상태
  const [sellerInfo, setSellerInfo] = useState("");
  const [buyerInfo, setBuyerInfo] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");

  // ✅ 창업자 특성 초기값 (5점 기준)
  const [founderTraits, setFounderTraits] = useState<FounderTraits>({
    obsession: 5, speed: 5, ambiguity: 5, feedback: 5,
    resource: 5, persuasion: 5, ethics: 5, stamina: 5
  });

  const handleTraitChange = (trait: keyof FounderTraits, value: number) => {
    setFounderTraits(prev => ({ ...prev, [trait]: value }));
  };

  const runAnalysis = async () => {
    if (!productName || !productDesc) {
      alert("아이템 이름과 설명을 입력해주세요.");
      return;
    }

    setLoading(true);
    setShowResults(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerInfo,
          buyerInfo,
          productInfo: { name: productName, desc: productDesc },
          founderTraits, // ✅ 신규 입력 데이터 전송
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        setShowResults(true); // 결과 화면으로 전환
      } else {
        alert("분석 실패: " + data.error);
      }
    } catch (e) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // --- 헬퍼 함수 및 컴포넌트 ---
  const StatBar = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold items-center">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClass}`} /> {label}
        </div>
        <span className={colorClass}>{value}점</span>
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
                   {deaths > 0 ? `${deaths}명 사망` : ""}
                </span>
              </div>
            </div>
          );
        })}
         <p className="text-center text-xs text-zinc-500 mt-2">단계별 사망자 수 (높을수록 위험)</p>
      </div>
    );
  };

  // 워드클라우드 데이터 추출
  const getWordCloudWords = (debateText: string) => {
      const keywordLine = debateText.split('\n').find(line => line.includes("키워드:"));
      if (!keywordLine) return [];
      const keywords = keywordLine.replace("키워드:", "").split(",").map(k => k.trim());
      // 간단하게 랜덤 가중치 부여
      return keywords.map(text => ({ text, value: Math.floor(Math.random() * 50) + 20 }));
  };


  // =========================================
  // 메인 UI 렌더링
  // =========================================
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 md:p-8 font-pretendard">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tight">
            ☠️ 스타트업 지옥 시뮬레이터
          </h1>
          <p className="text-zinc-400 text-lg">
            당신의 아이디어가 얼마나 빨리 망할지 팩트로 두들겨 드립니다.
          </p>
        </div>

        {/* ✅ 입력 화면 (결과 화면이 아닐 때만 표시) */}
        {!showResults && (
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-2xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Terminal className="w-6 h-6 text-red-500" /> 지옥문 입장 신청서
              </CardTitle>
              <CardDescription className="text-zinc-400">
                최대한 솔직하게 적으세요. 어차피 AI가 다 알아챕니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* 기본 정보 입력 (2열 그리드) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">🧑‍💻 판매자(나) 정보</label>
                  <Input placeholder="예: 30대 개발자, 영업 경험 없음, 멘탈 약함" value={sellerInfo} onChange={(e) => setSellerInfo(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-red-500/50 focus:border-red-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">🎯 타겟 고객 정보</label>
                  <Input placeholder="예: 20대 대학생, 가성비 중시, 유행에 민감" value={buyerInfo} onChange={(e) => setBuyerInfo(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-red-500/50 focus:border-red-500" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-red-400">📦 아이템 이름 (필수)</label>
                  <Input placeholder="예: AI 기반 자동 칫솔" value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-red-500/50 focus:border-red-500 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-red-400">📝 아이템 설명 (구체적으로)</label>
                  <Textarea placeholder="예: 10초 만에 양치 완료, 충치 자동 탐지 기능 포함. 예상 가격 19만원." value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="bg-zinc-800 border-zinc-700 focus:ring-red-500/50 focus:border-red-500 min-h-[100px]" />
                </div>
              </div>

              {/* ✅ 새로운 창업자 특성 입력 (슬라이더) */}
              <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2">
                    🧠 창업자 DNA 자가진단 (1점: 낮음 ~ 10점: 매우 높음)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    {Object.entries(founderTraits).map(([key, value]) => {
                        const labels: Record<string, string> = {
                            obsession: "고객/문제 집착 (Obsession)",
                            speed: "실행 속도 (Speed)",
                            ambiguity: "불확실성 내성 (Ambiguity Tolerance)",
                            feedback: "피드백 수용력 (Ego Control)",
                            resource: "리소스 감각 (Resourcefulness)",
                            persuasion: "설득력 (Persuasion)",
                            ethics: "윤리/신뢰 (Ethics/Trust)",
                            stamina: "체력/멘탈 (Stamina/Grit)"
                        };
                        return (
                            <div key={key} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <label className="font-bold text-zinc-300">{labels[key]}</label>
                                    <span className="text-red-400 font-bold">{value}점</span>
                                </div>
                                <input
                                    type="range" min="1" max="10" step="1" value={value}
                                    onChange={(e) => handleTraitChange(key as keyof FounderTraits, parseInt(e.target.value))}
                                    className="w-full accent-red-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        );
                    })}
                </div>
              </div>

              <Button onClick={runAnalysis} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold py-6 text-lg shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]">
                {loading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> 지옥불 시뮬레이션 돌리는 중...</> : "🔥 입장 버튼 누르기 (무료)"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ✅ 결과 화면 (showResults가 true일 때만 표시) */}
        {showResults && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 상단 생존율 요약 카드 */}
            <Card className="bg-zinc-900/80 border-red-900/30 shadow-2xl overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
                 <CardHeader className="pb-2 relative z-10">
                     <CardTitle className="flex items-center gap-2 text-red-400">
                         <AlertTriangle className="h-6 w-6 text-red-500" /> 시뮬레이션 최종 결과
                     </CardTitle>
                 </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">💀 생존 확률</p>
                        <p className="text-4xl font-extrabold text-red-500">{result.simulation.survival_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">⚰️ 주 사망 원인</p>
                        <Badge variant="destructive" className="text-sm px-3 py-1">{result.report.death_cause}</Badge>
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">🧗 최대 병목 구간</p>
                        <p className="text-xl font-bold text-white">{result.simulation.bottleneck_stage}</p>
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm font-bold mb-1">🎯 니즈 일치도</p>
                        <p className="text-2xl font-bold text-orange-400">{result.stats.consumer_needs}점</p>
                    </div>
                </CardContent>
            </Card>

            {/* ✅ 탭 네비게이션으로 결과 구성 변경 */}
            <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50 p-1">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-red-600 text-zinc-300 data-[state=active]:text-white font-bold">📊 종합 요약</TabsTrigger>
                    <TabsTrigger value="autopsy" className="data-[state=active]:bg-red-600 text-zinc-300 data-[state=active]:text-white font-bold">🧾 부검 리포트</TabsTrigger>
                    <TabsTrigger value="voc" className="data-[state=active]:bg-red-600 text-zinc-300 data-[state=active]:text-white font-bold">🗣️ 독설 좌담회(VoC)</TabsTrigger>
                </TabsList>

                {/* 탭 1: 종합 요약 (스탯, 깔때기, 워드클라우드) */}
                <TabsContent value="summary" className="space-y-6 mt-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 5대 스탯 */}
                         <Card className="bg-zinc-900/50 border-zinc-800 h-full">
                            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400"/> 5대 핵심 스탯 분석</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <StatBar label="Product (경쟁력)" value={result.stats.product} icon={ShoppingCart} colorClass="text-blue-400" />
                                <StatBar label="Team (실행력)" value={result.stats.team} icon={Users} colorClass="text-green-400" />
                                <StatBar label="Strategy (시장성)" value={result.stats.strategy} icon={Target} colorClass="text-purple-400" />
                                <StatBar label="Marketing (전달력)" value={result.stats.marketing} icon={TrendingUp} colorClass="text-yellow-400" />
                                <StatBar label="Consumer Needs (필요성)" value={result.stats.consumer_needs} icon={Heart} colorClass="text-red-400" />
                            </CardContent>
                        </Card>
                        
                        {/* 죽음의 깔때기 */}
                        <Card className="bg-zinc-900/50 border-zinc-800 h-full">
                             <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/> 죽음의 깔때기 (Death Funnel)</CardTitle></CardHeader>
                             <CardContent>{getFunnelChart(result.simulation)}</CardContent>
                        </Card>
                    </div>

                    {/* 워드 클라우드 (좌담회 키워드 기반) */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                ☁️ 아이템 핵심 키워드 (AI 인식)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] flex items-center justify-center bg-zinc-950/30 rounded-lg p-2">
                             {/* react-wordcloud 컴포넌트 사용 */}
                             <ReactWordcloud
                                words={getWordCloudWords(result.debate)}
                                options={{
                                    rotations: 2, rotationAngles: [0, 90], fontSizes: [20, 50],
                                    colors: ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#a855f7', '#ffffff'],
                                    enableTooltip: false, fontFamily: 'Pretendard'
                                }}
                             />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 탭 2: 부검 리포트 (넓은 레이아웃 적용) */}
                <TabsContent value="autopsy" className="space-y-6 mt-6 animate-in fade-in">
                     {/* 상단: 부검 결과 & 니즈 분석 병렬 배치 */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-zinc-900/50 border-red-900/50 shadow-sm">
                            <CardHeader><CardTitle className="text-lg font-bold text-red-400 flex items-center gap-2">🧾 상세 부검 결과</CardTitle></CardHeader>
                            <CardContent className="text-zinc-300 space-y-2 whitespace-pre-wrap leading-relaxed text-sm">
                                {result.report.autopsy_report}
                            </CardContent>
                        </Card>
                         <Card className="bg-zinc-900/50 border-zinc-800 shadow-sm">
                            <CardHeader><CardTitle className="text-lg font-bold text-orange-400 flex items-center gap-2">🎯 소비자 니즈 팩폭</CardTitle></CardHeader>
                             <CardContent className="text-zinc-300 space-y-2 whitespace-pre-wrap leading-relaxed text-sm font-medium">
                                "{result.report.needs_analysis}"
                            </CardContent>
                        </Card>
                     </div>

                    {/* 하단: 최후의 발악 (전체 폭 사용 - col-span-full) */}
                    <Card className="bg-red-950/30 border-red-900/50 shadow-lg col-span-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-red-200 flex items-center gap-2">
                                🩸 최후의 발악 (Action Plan)
                            </CardTitle>
                            <CardDescription className="text-red-300/70">지금 당장 실행하지 않으면 정말 죽습니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-red-100 leading-relaxed whitespace-pre-wrap p-6 bg-red-950/20 rounded-b-xl text-base font-medium">
                            {result.report.action_plan}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 탭 3: 좌담회 전문 */}
                <TabsContent value="voc" className="mt-6 animate-in fade-in">
                     <Card className="bg-zinc-900/50 border-zinc-800 shadow-xl">
                        <CardHeader>
                             <CardTitle className="text-xl font-bold flex items-center gap-2">
                                🗣️ 좌담회 결과 (VoC)
                             </CardTitle>
                             <CardDescription className="text-zinc-400">전문가 3인의 가감 없는 평가를 확인하세요.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-800/50 text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                                 {result.debate.split("키워드:")[0]} {/* 키워드 뒷부분은 자르고 본문만 표시 */}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {/* 다시하기 버튼 */}
            <div className="text-center pt-8">
              <Button variant="outline" onClick={() => setShowResults(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8 py-4">
                 🔄 다른 아이템으로 다시 검증하기
              </Button>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
