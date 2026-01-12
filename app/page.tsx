// app/page.tsx
"use client";

import { useMemo, useState } from "react";

/** ✅ 외부 패키지 없이: 파일 내장 SVG 아이콘 */
type IconProps = { className?: string };

const IconLoader2 = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
    <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 21a7 7 0 0 1 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
    <path d="M6 6h15l-1.5 9H7.5L6 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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

// --- 언어팩 ---
const translations = {
  ko: {
    title: "☠️ 스타트업 지옥 시뮬레이터",
    subtitle: "당신의 아이디어가 얼마나 빨리 망할지 팩트로 두들겨 드립니다.",
    startBtn: "🔥 스타트하기",
    startSub: "버튼 누르면 설문지가 열립니다.",
    analyzing: "💀 뼈 때리는 중...",
    homeHint: "양심을 버리실 땐 → 우측 하단 참고",

    formTitle: "지옥문 입장 신청서",
    formDesc: "최대한 솔직하게 적으세요. 어차피 AI가 다 알아챕니다.",
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
    diagnoseBtn: "☠️ 진단하기",
    backBtn: "← 메인으로",

    resultTitle: "시뮬레이션 결과",
    survival: "생존 확률",
    deathCause: "주 사망 원인",
    bottleneck: "최대 병목 구간",
    needsMatch: "니즈 일치도",
    tabSummary: "📊 종합 요약",
    tabAutopsy: "🧾 부검 리포트",
    tabVoc: "🗣️ 독설 좌담회",
    tabLinks: "🔗 추천/유사사례",
    statProduct: "제품 경쟁력",
    statTeam: "팀 역량",
    statStrategy: "시장 전략",
    statMarketing: "마케팅",
    statNeeds: "시장 니즈",
    funnelTitle: "죽음의 깔때기 (Death Funnel)",
    funnelDesc: "단계별 사망자 수 (높을수록 위험)",
    cloudTitle: "☁️ 핵심 키워드",
    autopsyTitle: "🧾 상세 부검 결과",
    needsTitle: "🎯 소비자 니즈 팩폭",
    actionTitle: "🩸 최후의 발악 (Action Plan)",
    vocTitle: "🗣️ 지옥의 독설 좌담회 전문",
    youtubeTitle: "▶️ 유튜브 추천 검색어",
    casesTitle: "🧩 유사 아이템/실패 사례(검색 결과)",
    retryBtn: "🔄 다시하기",
    editBtn: "✍️ 설문 수정",
  },
  en: {
    title: "☠️ Startup Hell Simulator",
    subtitle: "We brutally simulate how fast your idea will fail.",
    startBtn: "🔥 Start",
    startSub: "Click to open the survey.",
    analyzing: "💀 Roasting your idea...",
    homeHint: "When you abandon conscience → bottom right",

    formTitle: "Hell Gate Application",
    formDesc: "Be honest. AI knows everything anyway.",
    sellerInfo: "🧑‍💻 Seller (You)",
    sellerPlace: "e.g. 30yo Dev, No sales exp",
    buyerInfo: "🎯 Target Audience",
    buyerPlace: "e.g. College students, Price sensitive",
    itemName: "📦 Product Name (Required)",
    itemNamePlace: "e.g. AI Toothbrush",
    itemDesc: "📝 Description (Specific)",
    itemDescPlace: "Features, price, how it works...",
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
    diagnoseBtn: "☠️ Diagnose",
    backBtn: "← Back to Home",

    resultTitle: "Result",
    survival: "Survival Rate",
    deathCause: "Main Cause of Death",
    bottleneck: "Major Bottleneck",
    needsMatch: "Needs Match",
    tabSummary: "📊 Summary",
    tabAutopsy: "🧾 Autopsy",
    tabVoc: "🗣️ Debate",
    tabLinks: "🔗 Links/Cases",
    statProduct: "Product",
    statTeam: "Team",
    statStrategy: "Strategy",
    statMarketing: "Marketing",
    statNeeds: "Market Needs",
    funnelTitle: "Death Funnel",
    funnelDesc: "Deaths per stage (higher is worse)",
    cloudTitle: "☁️ Keywords",
    autopsyTitle: "🧾 Detailed Autopsy",
    needsTitle: "🎯 Needs Reality Check",
    actionTitle: "🩸 Action Plan",
    vocTitle: "🗣️ Toxic Panel",
    youtubeTitle: "▶️ YouTube Search Queries",
    casesTitle: "🧩 Similar items / failure cases (search results)",
    retryBtn: "🔄 Restart",
    editBtn: "✍️ Edit Survey",
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
  simulation: any;
  report: {
    death_cause: string;
    autopsy_report: string;
    action_plan: string;
    needs_analysis: string;
    youtube_queries?: string[];
    keywords?: string[];
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

type Step = "home" | "form" | "result";

function cleanText(input: string): string {
  if (!input) return "";
  return (
    input
      // markdown 굵게/기울임/코드/헤딩 흔적 제거
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`+/g, "")
      .replace(/^#+\s?/gm, "")
      // 혹시 남아있는 불필요한 마크다운 리스트 기호 정리
      .replace(/^\s*-\s+/gm, "• ")
      .replace(/^\s*\*\s+/gm, "• ")
      .trim()
  );
}

/** 텍스트를 "목록/문단"으로 보기 좋게 렌더 (마크다운 없이) */
function TextBlock({ text }: { text: string }) {
  const cleaned = cleanText(text);
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  const hasOrdered = lines.some((l) => /^\d+\.\s+/.test(l));
  const hasBullets = lines.some((l) => /^•\s+/.test(l));

  // ordered list
  if (hasOrdered) {
    const items = lines
      .map((l) => l.replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean);
    return (
      <ol className="list-decimal pl-5 space-y-2 text-zinc-200 text-sm leading-relaxed">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
    );
  }

  // bullet list
  if (hasBullets) {
    const items = lines.map((l) => l.replace(/^•\s+/, "").trim()).filter(Boolean);
    return (
      <ul className="list-disc pl-5 space-y-2 text-zinc-200 text-sm leading-relaxed">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  }

  // paragraphs
  return (
    <div className="space-y-3 text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
      {cleaned.split("\n\n").map((p, i) => (
        <p key={i}>{p.trim()}</p>
      ))}
    </div>
  );
}

function extractKeywordsFromDebate(debate: string): string[] {
  const txt = debate || "";
  const line = txt
    .split("\n")
    .map((l) => l.trim())
    .reverse()
    .find((l) => l.startsWith("키워드:") || l.toLowerCase().startsWith("keywords:"));

  if (!line) return [];
  const raw = line.split(":").slice(1).join(":").trim();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function youtubeSearchUrl(q: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ko");
  const t = translations[lang];

  const [step, setStep] = useState<Step>("home");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "autopsy" | "voc" | "links">("summary");

  // form state
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

  const keywords = useMemo(() => {
    const fromReport = result?.report?.keywords ?? [];
    if (fromReport.length) return fromReport.slice(0, 10);
    const fromDebate = extractKeywordsFromDebate(result?.debate ?? "");
    return fromDebate;
  }, [result]);

  const handleTraitChange = (key: keyof FounderTraits, val: number) => {
    setFounderTraits((prev) => ({ ...prev, [key]: val }));
  };

  const runAnalysis = async () => {
    if (!productName || !productDesc) {
      alert(lang === "ko" ? "아이템 이름과 설명을 입력해주세요." : "Please enter product name and description.");
      return;
    }

    setLoading(true);
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
        setStep("result");            // ✅ 결과 화면으로 "전환" (아래로 추가 X)
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

  // --- UI helpers ---
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
    const deathCounts: Record<string, number> = simulation?.death_counts ?? simulation?.deathCounts ?? {};
    const bottleneckStage: string =
      simulation?.bottleneck_stage ?? simulation?.bottleneckStage ?? simulation?.bottleneck ?? "";

    const maxDeaths = Math.max(...(Object.values(deathCounts) as number[]), 0) || 1;

    return (
      <div className="space-y-3 mt-4">
        {stages.map((stage) => {
          const deaths = deathCounts[stage] || 0;
          const isBottleneck = stage === bottleneckStage;
          const width = (deaths / maxDeaths) * 100;

          return (
            <div key={stage} className="flex items-center gap-2 text-sm text-zinc-300">
              <span className={`w-20 text-right font-bold ${isBottleneck ? "text-red-500" : "text-zinc-500"}`}>
                {stage}
              </span>
              <div className="flex-1 h-6 bg-zinc-800 rounded-sm overflow-hidden relative">
                <div
                  className={`h-full ${isBottleneck ? "bg-red-600" : "bg-zinc-600"} transition-all duration-1000`}
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

  const TagCloud = ({ words }: { words: string[] }) => {
    if (!words || words.length === 0) return <div className="text-zinc-500">No Data</div>;
    const sizes = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl font-bold"];
    const colors = ["text-red-400", "text-orange-400", "text-zinc-300", "text-blue-400", "text-white"];
    return (
      <div className="flex flex-wrap gap-4 justify-center items-center h-full p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 min-h-[180px]">
        {words.slice(0, 10).map((w, i) => (
          <span
            key={`${w}-${i}`}
            className={`${sizes[i % sizes.length]} ${colors[i % colors.length]} px-2 py-1 bg-zinc-800/30 rounded-lg`}
          >
            {w}
          </span>
        ))}
      </div>
    );
  };

  const survival = Number(result?.simulation?.survival_rate ?? result?.simulation?.survivalRate ?? 0);
  const bottleneck =
    result?.simulation?.bottleneck_stage ??
    result?.simulation?.bottleneckStage ??
    result?.simulation?.bottleneck ??
    "-";

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* 언어 버튼 */}
        <div className="absolute top-0 right-0 flex gap-2">
          <button
            onClick={() => setLang("ko")}
            className={`px-3 py-1 text-sm font-bold rounded-md border ${
              lang === "ko" ? "bg-red-600 border-red-600 text-white" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            🇰🇷 KO
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 text-sm font-bold rounded-md border ${
              lang === "en" ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            🇺🇸 EN
          </button>
        </div>

        {/* 공통 헤더 */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tight">
            {t.title}
          </h1>
          <p className="text-zinc-400 text-lg">{t.subtitle}</p>
        </div>

        {/* =======================
            STEP 1) HOME
        ======================= */}
        {step === "home" && (
          <div className="space-y-6">
            {/* HERO IMAGE */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-4xl rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 shadow-2xl">
                <div className="px-4 py-3 text-sm md:text-base font-bold text-zinc-200 border-b border-zinc-800 bg-zinc-950/40">
                  <span className="text-red-400">{t.homeHint}</span>
                </div>

                <div className="relative">
                  <img src="/images/jjal.jpeg" alt="Startup Hell Meme" className="w-full h-auto object-cover" />
                  <div className="absolute bottom-3 right-3 text-[11px] md:text-xs px-2 py-1 rounded-md bg-black/60 text-zinc-200 border border-white/10">
                    hell-sim v1
                  </div>
                </div>
              </div>
            </div>

            {/* START BUTTON */}
            <div className="max-w-4xl mx-auto text-center space-y-3">
              <p className="text-zinc-400">{t.startSub}</p>
              <button
                onClick={() => setStep("form")}
                className="w-full max-w-xl mx-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold py-4 px-6 rounded-xl text-lg shadow-lg transition-all"
              >
                {t.startBtn}
              </button>
            </div>
          </div>
        )}

        {/* =======================
            STEP 2) FORM
        ======================= */}
        {step === "form" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("home")}
              className="text-sm font-bold text-zinc-400 hover:text-white"
            >
              {t.backBtn}
            </button>

            <div className="bg-zinc-900/50 border border-zinc-800 shadow-2xl backdrop-blur-sm rounded-xl p-6">
              <div className="mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <IconTerminal className="w-6 h-6 text-red-500" />
                  {t.formTitle}
                </h2>
                <p className="text-zinc-400 mt-1">{t.formDesc}</p>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 block">{t.sellerInfo}</label>
                    <input
                      type="text"
                      placeholder={t.sellerPlace}
                      value={sellerInfo}
                      onChange={(e) => setSellerInfo(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 block">{t.buyerInfo}</label>
                    <input
                      type="text"
                      placeholder={t.buyerPlace}
                      value={buyerInfo}
                      onChange={(e) => setBuyerInfo(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-red-400 block">{t.itemName}</label>
                    <input
                      type="text"
                      placeholder={t.itemNamePlace}
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-bold focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-red-400 block">{t.itemDesc}</label>
                    <textarea
                      placeholder={t.itemDescPlace}
                      value={productDesc}
                      onChange={(e) => setProductDesc(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white min-h-[120px] focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* 창업자 특성 */}
                <div>
                  <h3 className="text-lg font-bold text-zinc-200 mb-4">{t.traitsTitle}</h3>
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
                            handleTraitChange(key as keyof FounderTraits, parseInt(e.target.value, 10))
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
                    t.diagnoseBtn
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================
            STEP 3) RESULT (새 화면)
        ======================= */}
        {step === "result" && result && (
          <div className="space-y-8">
            {/* 상단 액션 버튼 */}
            <div className="flex flex-col md:flex-row gap-3 justify-end">
              <button
                onClick={() => setStep("form")}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-200 hover:bg-zinc-800 font-bold"
              >
                {t.editBtn}
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setStep("home");
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 font-bold"
              >
                {t.retryBtn}
              </button>
            </div>

            {/* 요약 카드 */}
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
                  <p className="text-4xl font-extrabold text-red-500">{survival.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">⚰️ {t.deathCause}</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-red-900/50 text-red-200 text-sm font-bold border border-red-800">
                    {cleanText(result.report.death_cause)}
                  </span>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">🧗 {t.bottleneck}</p>
                  <p className="text-xl font-bold text-white">{String(bottleneck || "-")}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-bold mb-1">🎯 {t.needsMatch}</p>
                  <p className="text-2xl font-bold text-orange-400">{result.stats.consumer_needs}점</p>
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div className="w-full">
              <div className="grid w-full grid-cols-4 bg-zinc-800/50 p-1 rounded-lg mb-6">
                {(
                  [
                    ["summary", t.tabSummary],
                    ["autopsy", t.tabAutopsy],
                    ["voc", t.tabVoc],
                    ["links", t.tabLinks],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={`py-2 text-sm font-bold rounded-md transition-all ${
                      activeTab === k ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Summary */}
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
                    <TagCloud words={keywords} />
                  </div>
                </div>
              )}

              {/* Autopsy */}
              {activeTab === "autopsy" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/50 border border-red-900/50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-red-400 mb-4">{t.autopsyTitle}</h3>
                      <TextBlock text={result.report.autopsy_report} />
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-orange-400 mb-4">{t.needsTitle}</h3>
                      <TextBlock text={result.report.needs_analysis} />
                    </div>
                  </div>

                  <div className="bg-red-950/30 border border-red-900/50 shadow-lg rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-red-900/30">
                      <h3 className="text-xl font-bold text-red-200">{t.actionTitle}</h3>
                    </div>
                    <div className="p-6 bg-red-950/20">
                      <TextBlock text={result.report.action_plan} />
                    </div>
                  </div>
                </div>
              )}

              {/* Debate */}
              {activeTab === "voc" && (
                <div className="bg-zinc-900/50 border border-zinc-800 shadow-xl rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">{t.vocTitle}</h3>
                  <div className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-800/50 text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {cleanText(result.debate)}
                  </div>
                </div>
              )}

              {/* Links / Cases */}
              {activeTab === "links" && (
                <div className="space-y-6">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">{t.youtubeTitle}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(result.report.youtube_queries ?? []).slice(0, 3).map((q, i) => (
                        <a
                          key={i}
                          href={youtubeSearchUrl(q)}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 transition"
                        >
                          <div className="text-sm text-zinc-400 font-bold mb-1">Query {i + 1}</div>
                          <div className="text-zinc-100 font-extrabold">{q}</div>
                          <div className="text-xs text-zinc-500 mt-2">YouTube 검색 열기</div>
                        </a>
                      ))}
                      {(!result.report.youtube_queries || result.report.youtube_queries.length === 0) && (
                        <div className="text-zinc-500 text-sm">유튜브 추천 검색어가 비어있습니다. (API 리턴 확인)</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">{t.casesTitle}</h3>
                    <div className="space-y-3">
                      {(result.pastCases ?? []).slice(0, 6).map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 transition"
                        >
                          <div className="text-zinc-100 font-bold">{c.title}</div>
                          <div className="text-zinc-400 text-sm mt-2 line-clamp-3">
                            {String(c.content ?? "").slice(0, 220)}...
                          </div>
                          <div className="text-xs text-zinc-500 mt-2">링크 열기</div>
                        </a>
                      ))}
                      {(!result.pastCases || result.pastCases.length === 0) && (
                        <div className="text-zinc-500 text-sm">검색된 유사 사례가 없습니다. (Tavily API 키/호출 확인)</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
