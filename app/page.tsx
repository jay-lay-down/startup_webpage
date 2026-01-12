// app/page.tsx
"use client";

import { useState } from "react";

/** ✅ 외부 아이콘 패키지(lucide-react) 없이도 빌드되도록: 파일 안에 SVG 아이콘 내장 */
type IconProps = { className?: string };

const IconLoader2 = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M21 12a9 9 0 1 1-2.64-6.36"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconAlertTriangle = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconTerminal = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 17V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="m7 9 2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconTrendingUp = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 8h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUsers = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M16 11a4 4 0 1 0-8 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M3 21a7 7 0 0 1 18 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconTarget = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const IconShoppingCart = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 6h15l-1.5 9H7.5L6 6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="9" cy="20" r="1" fill="currentColor" />
    <circle cx="18" cy="20" r="1" fill="currentColor" />
  </svg>
);

const IconHeart = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 21s-7-4.35-9.5-8.5C.2 8.7 2.1 5.5 5.6 5.1c1.9-.2 3.6.7 4.4 2 0 0 .8-2.2 4.4-2 3.5.4 5.4 3.6 3.1 7.4C19 16.65 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

// --- 언어 팩 ---
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
      stamina: "체력/멘탈",
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
    retryBtn: "🔄 다시하기",
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
      stamina: "Stamina/Grit",
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
    retryBtn: "🔄 Try Again",
  },
} as const;

type Lang = keyof typeof translations;

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
    survival_rate?: number;
    death_counts?: Record<string, number>;
    bottleneck_stage?: string;
    // 백엔드 키가 다를 때 대비(유연)
    bottleneck?: string;
    survivalRate?: number;
    deathCounts?: Record<string, number>;
    bottleneckStage?: string;
  };
  report: {
    death_cause: string;
    autopsy_report: string;
    action_plan: string;
    needs_analysis: string;
    keywords?: string[]; // ✅ 없을 수도 있으니 optional
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
  const [lang, setLang] = useState<Lang>("ko");
  const t = translations[lang];

  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "autopsy" | "voc">("summary");

  const [sellerInfo, setSellerInfo] = useState("");
  const [buyerInfo, setBuyerInfo] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");

  const [founderTraits, setFounderTraits] = useState<FounderTraits>({
    obsession: 5,
    speed: 5,
    ambiguity: 5,
    feedback: 5,
    resource: 5,
    persuasion: 5,
    ethics: 5,
    stamina: 5,
  });

  const handleTraitChange = (key: keyof FounderTraits, val: number) => {
    setFounderTraits((prev) => ({ ...prev, [key]: val }));
  };

  const runAnalysis = async () => {
    if (!productName || !productDesc) {
      alert(
        lang === "ko"
          ? "아이템 이름과 설명을 입력해주세요."
          : "Please enter product name and description."
      );
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

      const data = (await res.json()) as AnalysisResult;

      if (data?.success) {
        setResult(data);
        setShowResults(true);
        setActiveTab("summary");
      } else {
        alert("Error: " + (data?.error ?? "Unknown error"));
      }
    } catch {
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  // --- 커스텀 컴포넌트들 ---
  const StatBar = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold items-center text-zinc-300">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span>{label}</span>
        </div>
        <span className={colorClass}>{value}/100</span>
      </div>
      <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass.replace("text", "bg")} transition-all duration-1000`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );

  const FunnelChart = ({ simulation }: { simulation: any }) => {
    const stages = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"];

    const deathCounts: Record<string, number> =
      simulation?.death_counts ??
      simulation?.deathCounts ??
      {};

    const bottleneckStage: string =
      simulation?.bottleneck_stage ??
      simulation?.bottleneckStage ??
      simulation?.bottleneck ??
      "";

    const maxDeaths =
      Math.max(...(Object.values(deathCounts) as number[]), 0) || 1;

    return (
      <div className="space-y-3 mt-4">
        {stages.map((stage) => {
          const deaths = deathCounts[stage] || 0;
          const isBottleneck = stage === bottleneckStage;
          const width = (deaths / maxDeaths) * 100;

          return (
            <div key={stage} className="flex items-center gap-2 text-sm text-zinc-300">
              <span
                className={`w-20 text-right font-bold ${
                  isBottleneck ? "text-red-500" : "text-zinc-500"
                }`}
              >
                {stage}
              </span>
              <div className="flex-1 h-6 bg-zinc-800 rounded-sm overflow-hidden relative">
                <div
                  className={`h-full ${
                    isBottleneck ? "bg-red-600" : "bg-zinc-600"
                  } transition-all duration-1000`}
                  style={{ width: `${Math.max(width, deaths > 0 ? 2 : 0)}%` }}
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

  const TagCloud = ({ keywords }: { keywords?: string[] }) => {
    if (!keywords || keywords.length === 0) {
      return <div className="text-zinc-500">No Data</div>;
    }

    const getStyle = (i: number) => {
      const sizes = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl font-bold"];
      const colors = ["text-red-400", "text-orange-400", "text-zinc-300", "text-blue-400", "text-white"];
      return `${sizes[i % sizes.length]} ${colors[i % colors.length]}`;
    };

    return (
      <div className="flex flex-wrap gap-4 justify-center items-center h-full p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 min-h-[200px]">
        {keywords.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={`${getStyle(i)} transition-all hover:scale-110 cursor-default px-2 py-1 bg-zinc-800/30 rounded-lg`}
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  const survival =
    result?.simulation?.survival_rate ??
    result?.simulation?.survivalRate ??
    0;

  const bottleneck =
    result?.simulation?.bottleneck_stage ??
    result?.simulation?.bottleneckStage ??
    result?.simulation?.bottleneck ??
    "-";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* 언어 선택 버튼 */}
        <div className="absolute top-0 right-0 flex gap-2">
          <button
            onClick={() => setLang("ko")}
            className={`px-3 py-1 text-sm font-bold rounded-md border ${
              lang === "ko"
                ? "bg-red-600 border-red-600 text-white"
                : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            🇰🇷 KO
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 text-sm font-bold rounded-md border ${
              lang === "en"
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            🇺🇸 EN
          </button>
        </div>

        {/* 헤더 */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tight">
            {t.title}
          </h1>
          <p className="text-zinc-400 text-lg">{t.subtitle}</p>
        </div>

        {/* 입력 화면 */}
        {!showResults && (
          <div className="bg-zinc-900/50 border border-zinc-800 shadow-2xl backdrop-blur-sm rounded-xl p-6">
            <div className="mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                <IconTerminal className="w-6 h-6 text-red-500" />
                {t.inputTitle}
              </h2>
              <p className="text-zinc-400 mt-1">{t.inputDesc}</p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 block">
                    {t.sellerInfo}
                  </label>
                  <input
                    type="text"
                    placeholder={t.sellerPlace}
                    value={sellerInfo}
                    onChange={(e) => setSellerInfo(e.target.value)}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300 block">
                    {t.buyerInfo}
                  </label>
                  <input
                    type="text"
                    placeholder={t.buyerPlace}
                    value={buyerInfo}
                    onChange={(e) => setBuyerInfo(e.target.value)}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-red-400 block">
                    {t.itemName}
                  </label>
                  <input
                    type="text"
                    placeholder={t.itemNamePlace}
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-bold focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-red-400 block">
                    {t.itemDesc}
                  </label>
                  <textarea
                    placeholder={t.itemDescPlace}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white min-h-[100px] focus:outline-none focus:border-red-500"
                  />
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
                        <label className="font-bold text-zinc-300">
                          {t.traits[key as keyof typeof t.traits]}
                        </label>
                        <span className="text-red-400 font-bold">
                          {founderTraits[key as keyof FounderTraits]}점
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={founderTraits[key as keyof FounderTraits]}
                        onChange={(e) =>
                          handleTraitChange(
                            key as keyof FounderTraits,
                            parseInt(e.target.value, 10)
                          )
                        }
                        className="w-full accent-red-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={runAnalysis}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold py-4 px-6 rounded-xl text-lg shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    {t.analyzing}
                  </>
                ) : (
                  t.enterBtn
                )}
              </button>
            </div>
          </div>
        )}

        {/* 결과 화면 */}
        {showResults && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 상단 요약 카드 */}
            <div className="bg-zinc-900/80 border border-red-900/30 shadow-2xl relative overflow-hidden rounded-xl p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
              <div className="pb-4 relative z-10 border-b border-zinc-800 mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-red-400">
                  <IconAlertTriangle className="h-6 w-6 text-red-500" />
                  {t.resultTitle}
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
                <div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">💀 {t.survival}</p>
                  <p className="text-4xl font-extrabold text-red-500">
                    {Number(survival).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">⚰️ {t.deathCause}</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-red-900/50 text-red-200 text-sm font-bold border border-red-800">
                    {result.report.death_cause}
                  </span>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">🧗 {t.bottleneck}</p>
                  <p className="text-xl font-bold text-white">{bottleneck || "-"}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">🎯 {t.needsMatch}</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {result.stats.consumer_needs}점
                  </p>
                </div>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="w-full">
              <div className="grid w-full grid-cols-3 bg-zinc-800/50 p-1 rounded-lg mb-6">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`py-2 text-sm font-bold rounded-md transition-all ${
                    activeTab === "summary"
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.tabSummary}
                </button>
                <button
                  onClick={() => setActiveTab("autopsy")}
                  className={`py-2 text-sm font-bold rounded-md transition-all ${
                    activeTab === "autopsy"
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.tabAutopsy}
                </button>
                <button
                  onClick={() => setActiveTab("voc")}
                  className={`py-2 text-sm font-bold rounded-md transition-all ${
                    activeTab === "voc"
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.tabVoc}
                </button>
              </div>

              {/* 탭 1 */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 h-full rounded-xl p-6">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                        <IconTrendingUp className="w-5 h-5 text-blue-400" />
                        5 Stats
                      </h3>
                      <div className="space-y-6">
                        <StatBar label={t.statProduct} value={result.stats.product} icon={IconShoppingCart} colorClass="text-blue-400" />
                        <StatBar label={t.statTeam} value={result.stats.team} icon={IconUsers} colorClass="text-green-400" />
                        <StatBar label={t.statStrategy} value={result.stats.strategy} icon={IconTarget} colorClass="text-purple-400" />
                        <StatBar label={t.statMarketing} value={result.stats.marketing} icon={IconTrendingUp} colorClass="text-yellow-400" />
                        <StatBar label={t.statNeeds} value={result.stats.consumer_needs} icon={IconHeart} colorClass="text-red-400" />
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 h-full rounded-xl p-6">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                        <IconAlertTriangle className="w-5 h-5 text-red-500" />
                        {t.funnelTitle}
                      </h3>
                      <FunnelChart simulation={result.simulation} />
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">{t.cloudTitle}</h3>
                    <TagCloud keywords={result.report.keywords ?? []} />
                  </div>
                </div>
              )}

              {/* 탭 2 */}
              {activeTab === "autopsy" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/50 border border-red-900/50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-red-400 mb-4">{t.autopsyTitle}</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {result.report.autopsy_report}
                      </p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-orange-400 mb-4">{t.needsTitle}</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                        "{result.report.needs_analysis}"
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-950/30 border border-red-900/50 shadow-lg rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-red-900/30">
                      <h3 className="text-xl font-bold text-red-200">{t.actionTitle}</h3>
                    </div>
                    <div className="text-red-100 p-6 bg-red-950/20 text-base font-medium whitespace-pre-wrap">
                      {result.report.action_plan}
                    </div>
                  </div>
                </div>
              )}

              {/* 탭 3 */}
              {activeTab === "voc" && (
                <div className="bg-zinc-900/50 border border-zinc-800 shadow-xl rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">{t.vocTitle}</h3>
                  <div className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-800/50 text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {result.debate}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center pt-8">
              <button
                onClick={() => setShowResults(false)}
                className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8 py-4 rounded-xl font-bold transition-all"
              >
                {t.retryBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
