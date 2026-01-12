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

// extra icons for 11 stats / market
const IconDollar = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2v20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M17 7.5c0-2-2.2-3.5-5-3.5s-5 1.5-5 3.5 2.2 3.5 5 3.5 5 1.5 5 3.5-2.2 3.5-5 3.5-5-1.5-5-3.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconCash = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M7 10h.01M17 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconTruck = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 7h11v10H3V7Z" stroke="currentColor" strokeWidth="2" />
    <path d="M14 10h4l3 3v4h-7v-7Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="7" cy="19" r="1" fill="currentColor" />
    <circle cx="18" cy="19" r="1" fill="currentColor" />
  </svg>
);

const IconGlobe = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 3c3 3 3 15 0 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 3c-3 3-3 15 0 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconPie = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 12V3a9 9 0 1 1-9 9h9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 3a9 9 0 0 1 9 9h-9V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

/** ✅ 간단 툴팁 (외부 패키지 없이) */
function InfoTip({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className="relative inline-flex items-center group align-middle">
      <span
        className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full border border-zinc-700 text-zinc-300 text-xs font-black bg-zinc-900/60 cursor-help select-none"
        aria-label="info"
        title={text}
      >
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[260px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        <span className="block text-xs leading-relaxed text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl">
          {text}
        </span>
      </span>
    </span>
  );
}

// --- 언어팩 ---
const translations = {
  ko: {
    title: "☠️ 스타트업 지옥 시뮬레이터",
    subtitle: "안녕하세요. 쓰레기를 버려주세요.",
    startBtn: "🔥 START",
    startSub: "버튼 누르면 체크리스트가 열립니다.",
    analyzing: "💀 쓰레기통으로 아이디어를 버리는 중...",
    homeHint: "양심을 버리시나요?",

    formTitle: "쓰레기통 입장 신청서",
    formDesc: "최대한 솔직하게 적으세요. 어차피 AI가 다 알아챕니다.",

    itemCategory: "🏷️ 품목/카테고리 (필수)",
    itemCategoryPlace: "예: 가전 / 뷰티 / 식품 / SaaS / 교육 / 헬스케어 ...",
    itemCategoryPreset: "품목 선택",
    itemCategoryDirect: "직접 입력",
    itemCategoryDirectPlace: "예: 가전(냉장고), 생활가전, 뷰티(스킨케어) 등",

    sellerInfo: "🧑‍💻 판매자(나) 정보",
    sellerPlace: "예: 30대 개발자, 영업 경험 없음",
    buyerInfo: "🎯 타겟 고객 정보",
    buyerPlace: "예: 20대 대학생, 가성비 중시",

    itemName: "📦 아이템 이름 (필수)",
    itemNamePlace: "예: AI 기반 자동 칫솔",
    itemDesc: "📝 아이템 설명 (구체적으로)",
    itemDescPlace: "상세 기능과 가격을 적어주세요.",

    // extra fields for better market research
    concept: "🧩 컨셉(포지셔닝 한 줄)",
    conceptPlace: "예: '월 1만원으로 집안 먼지/털 자동 해결' 같은 한 줄",
    price: "💳 가격(대략)",
    pricePlace: "예: 19,900원 / $29 / 월 9.99 ...",
    businessModel: "🧾 BM(돈 버는 법)",
    businessModelPlace: "예: 구독/1회 구매/수수료/광고/리텐션 업셀...",
    salesChannel: "🛒 판매 채널",
    salesChannelPlace: "예: 쿠팡/아마존/D2C/오프라인 유통/앱스토어...",
    salesCountry: "🌍 판매 국가",
    salesCountryPlace: "예: 한국/미국/일본/동남아...",

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
    tabMarket: "🥧 시장점유율",
    tabLinks: "🔗 추천/유사사례",

    statProduct: "제품 경쟁력",
    statFounder: "창업자 역량",
    statStrategy: "시장 전략",
    statMarketing: "마케팅",
    statNeeds: "시장 니즈",

    statConcept: "컨셉 적합",
    statPriceFit: "가격 적합",
    statBusinessModel: "BM 타당성",
    statDistribution: "유통/채널 실행",
    statScope: "시장 확장성",
    statPotential: "잠재고객(지갑)",

    funnelTitle: "Death Funnel",
    funnelDesc: "단계별 ㅈ망 가능성",
    cloudTitle: "☁️ 핵심 키워드",
    autopsyTitle: "🧾 상세 부검 결과",
    needsTitle: "🎯 소비자 니즈",
    actionTitle: "🩸 최후의 발악",
    vocTitle: "🗣️ 지옥에서 온 좌담회",
    youtubeTitle: "▶️ 유튜브 추천 검색어",
    casesTitle: "🧩 유사 아이템/실패 사례(검색 결과)",
    retryBtn: "🔄 다시하기",
    editBtn: "✍️ 설문 응답 수정",

    // market section
    marketSectionTitle: "🥧 시장점유율 시뮬레이션",
    marketModeLabel: "시장정보 입력 방식",
    marketModeNone: "안 할래요(점유율 계산 X)",
    marketModeAuto: "모름 → 자동 시장조사(Tavily + AI)",
    marketModeManual: "알아요 → 직접 입력(3점 추정: min/mode/max)",
    marketManualHint:
      "가능한 '연간' 기준으로 넣으세요. 예: 시장매출(연간), 평균가격(1회 결제), 구매빈도(연/인), 침투율 상한(0~1).",
    marketTabTitle: "시장점유율/파이 먹기",
    marketNeededMsg:
      "시장점유율 계산에 필요한 시장정보가 부족합니다. 설문에서 '자동 시장조사' 또는 '직접 입력'을 선택해주세요.",
    marketAssumptionsTitle: "사용된 시장 가정",
    marketSourcesTitle: "자동 시장조사 출처(일부)",
    marketMetaTitle: "자동 추정 메모",
    marketShareTitle: "예상 시장점유율(Revenue 기준)",
    marketShareNote: "모델은 '생존'을 통과한 시뮬레이션 런에서만 점유율을 계산합니다.",
    marketGraphTitle: "면적(파이) 시각화",
    marketTotal: "전체 시장(추정)",
    marketSAM: "도달 가능한 시장(SAM)",
    marketSOM: "실제로 먹을 수 있는 파이(SOM)",
    marketYou: "당신(추정 매출)",
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

    itemCategory: "🏷️ Category (Required)",
    itemCategoryPlace: "e.g. Home appliance / Beauty / Food / SaaS / Education / Healthcare ...",
    itemCategoryPreset: "Select category",
    itemCategoryDirect: "Custom input",
    itemCategoryDirectPlace: "e.g. Home appliance (fridge), Beauty (skincare) ...",

    sellerInfo: "🧑‍💻 Seller (You)",
    sellerPlace: "e.g. 30yo Dev, No sales exp",
    buyerInfo: "🎯 Target Audience",
    buyerPlace: "e.g. College students, Price sensitive",

    itemName: "📦 Product Name (Required)",
    itemNamePlace: "e.g. AI Toothbrush",
    itemDesc: "📝 Description (Specific)",
    itemDescPlace: "Features, price, how it works...",

    concept: "🧩 Concept (one-liner positioning)",
    conceptPlace: "e.g. 'Solve dust & hair automatically for $9.99/mo'",
    price: "💳 Price (rough)",
    pricePlace: "e.g. $29 / 19,900 KRW / $9.99/mo ...",
    businessModel: "🧾 Business model",
    businessModelPlace: "Subscription / One-off purchase / Commission / Ads ...",
    salesChannel: "🛒 Sales channel",
    salesChannelPlace: "Amazon / Coupang / D2C / Offline retail / App store ...",
    salesCountry: "🌍 Country",
    salesCountryPlace: "Korea / US / Japan / SEA ...",

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
    tabMarket: "🥧 Market Share",
    tabLinks: "🔗 Links/Cases",

    statProduct: "Product",
    statFounder: "Founder",
    statStrategy: "Strategy",
    statMarketing: "Marketing",
    statNeeds: "Market Needs",

    statConcept: "Concept fit",
    statPriceFit: "Price fit",
    statBusinessModel: "Business model fit",
    statDistribution: "Distribution",
    statScope: "Market scope",
    statPotential: "Potential buyers",

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

    marketSectionTitle: "🥧 Market share simulation",
    marketModeLabel: "Market info mode",
    marketModeNone: "Skip (no market share)",
    marketModeAuto: "I don't know → Auto research (Tavily + AI)",
    marketModeManual: "I know → Manual input (min/mode/max)",
    marketManualHint:
      "Use yearly basis if possible. e.g. market revenue (yearly), avg price (per purchase), purchase freq (per year), max penetration (0~1).",
    marketTabTitle: "Market share / pie slice",
    marketNeededMsg:
      "Not enough market data for share calculation. Choose 'Auto research' or 'Manual input' in the survey.",
    marketAssumptionsTitle: "Market assumptions used",
    marketSourcesTitle: "Auto research sources",
    marketMetaTitle: "Auto estimation notes",
    marketShareTitle: "Estimated market share (Revenue)",
    marketShareNote: "Share is computed only for runs that survive through stages.",
    marketGraphTitle: "Area (pie) visualization",
    marketTotal: "Total market",
    marketSAM: "Addressable (SAM)",
    marketSOM: "Obtainable (SOM)",
    marketYou: "You (revenue)",
  },
} as const;

type Lang = keyof typeof translations;

type Tri = { min: number; mode: number; max: number };
type MarketMode = "none" | "manual" | "auto";

type MarketAssumptionsInput = {
  market_customers?: Tri;
  market_revenue?: Tri;
  price?: Tri;
  purchase_freq_per_year?: Tri;
  max_penetration?: Tri;
};

type AnalysisResult = {
  success: boolean;
  stats: {
    product: number;
    founder: number;
    strategy: number;
    marketing: number;
    consumer_needs: number;

    concept_fit: number;
    price_fit: number;
    business_model_fit: number;
    distribution: number;
    market_scope: number;
    potential_customers: number;

    // legacy fallback (혹시 예전 데이터가 남아있을 경우)
    team?: number;
  };
  simulation: any;
  report: {
    death_cause: string;
    autopsy_report: string;
    action_plan: string;
    needs_analysis: string;
    youtube_queries?: string[];
    keywords?: string[];
    market_takeaway?: string;
  };
  debate: string;
  pastCases: Array<{ title: string; url: string; content: string }>;
  marketMode?: MarketMode;
  marketAssumptionsUsed?: any;
  marketSizingSources?: Array<{ title: string; url: string; content: string }>;
  marketAutoMeta?: { assumed_fields: string[]; rationale: string } | null;
  priceReference?: {
    min?: number;
    max?: number;
    currency_or_unit_note?: string;
    source?: string;
    user_price?: number | null;
  } | null;
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
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`+/g, "")
      .replace(/^#+\s?/gm, "")
      .replace(/^\s*-\s+/gm, "• ")
      .replace(/^\s*\*\s+/gm, "• ")
      .trim()
  );
}

/** 텍스트를 "목록/문단"으로 보기 좋게 렌더 (마크다운 없이) */
function TextBlock({ text }: { text: string }) {
  const cleaned = cleanText(text);
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const hasOrdered = lines.some((l) => /^\d+\.\s+/.test(l));
  const hasBullets = lines.some((l) => /^•\s+/.test(l));

  if (hasOrdered) {
    const items = lines.map((l) => l.replace(/^\d+\.\s+/, "").trim()).filter(Boolean);
    return (
      <ol className="list-decimal pl-5 space-y-2 text-zinc-200 text-sm leading-relaxed">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
    );
  }

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

  return (
    <div className="space-y-3 text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
      {cleaned.split("\n\n").map((p, i) => (
        <p key={i}>{p.trim()}</p>
      ))}
    </div>
  );
}

function ActionList({ text }: { text: string }) {
  const cleaned = cleanText(text);
  const numbered = cleaned.split(/\s*\d+\.\s+/).map((l) => l.trim()).filter(Boolean);
  let items = numbered.length > 1 ? numbered : cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  if (items.length <= 1 && cleaned.includes(",")) {
    items = cleaned.split(",").map((l) => l.trim()).filter(Boolean);
  }
  return (
    <ul className="space-y-3 text-zinc-200 text-sm leading-relaxed">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-red-500/60 bg-red-950/30">
            <span className="h-2 w-2 rounded-sm bg-red-400/70" />
          </span>
          <span>{it.replace(/^[\-\u2022•]\s*/, "").trim()}</span>
        </li>
      ))}
    </ul>
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

function safeNum(v: string): number | null {
  const x = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : null;
}

function triFromStrings(minS: string, modeS: string, maxS: string): Tri | undefined {
  const min = safeNum(minS);
  const mode = safeNum(modeS);
  const max = safeNum(maxS);
  if (min == null || mode == null || max == null) return undefined;
  if (!(min <= mode && mode <= max)) return undefined;
  return { min, mode, max };
}

function fmtMoney(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "-";
  // 너무 큰 수는 K/M/B로
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
  return String(Math.round(v));
}

function fmtInt(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "-";
  return Math.round(v).toLocaleString();
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ko");
  const t = translations[lang];

  const [step, setStep] = useState<Step>("home");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "autopsy" | "voc" | "market" | "links">("summary");

  // form state
  const [categoryPreset, setCategoryPreset] = useState<string>("가전");
  const [categoryCustom, setCategoryCustom] = useState<string>("");

  const itemCategory = useMemo(() => {
    if (categoryPreset === "__custom__") return (categoryCustom || "").trim();
    return (categoryPreset || "").trim();
  }, [categoryPreset, categoryCustom]);

  const [sellerInfo, setSellerInfo] = useState("");
  const [buyerInfo, setBuyerInfo] = useState("");
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");

  // extra fields
  const [concept, setConcept] = useState("");
  const [priceText, setPriceText] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [salesChannel, setSalesChannel] = useState("");
  const [salesCountry, setSalesCountry] = useState("");

  // market settings
  const [marketMode, setMarketMode] = useState<MarketMode>("auto");

  // manual market inputs (strings)
  const [mRevMin, setMRevMin] = useState("");
  const [mRevMode, setMRevMode] = useState("");
  const [mRevMax, setMRevMax] = useState("");

  const [mPriceMin, setMPriceMin] = useState("");
  const [mPriceMode, setMPriceMode] = useState("");
  const [mPriceMax, setMPriceMax] = useState("");

  const [mFreqMin, setMFreqMin] = useState("");
  const [mFreqMode, setMFreqMode] = useState("");
  const [mFreqMax, setMFreqMax] = useState("");

  const [mPenMin, setMPenMin] = useState("");
  const [mPenMode, setMPenMode] = useState("");
  const [mPenMax, setMPenMax] = useState("");

  const [mCustMin, setMCustMin] = useState("");
  const [mCustMode, setMCustMode] = useState("");
  const [mCustMax, setMCustMax] = useState("");

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

  // ✅ 툴팁 텍스트(용어 정의)
  const statTooltips = useMemo(() => {
    if (lang === "en") {
      return {
        product: "Differentiation, quality, feasibility, defensibility.",
        founder: "Founder capacity: execution, leadership, grit, persuasion.",
        strategy: "Go-to-market & positioning realism.",
        marketing: "Customer acquisition ability & channel realism.",
        consumer_needs: "Pain intensity + urgency + willingness to pay.",

        concept_fit: "Clarity/uniqueness/positioning fit.",
        price_fit: "Pricing rationality, willingness to pay, value alignment.",
        business_model_fit: "Revenue model, margin, unit economics viability.",
        distribution: "Channel fit + ops/logistics/partner feasibility.",
        market_scope: "Regulation/competition/expandability across segments/regions.",
        potential_customers: "Size of buyers who can actually pay + reachable.",

        funnel: "Deaths by stage. Higher bars mean the idea tends to die there.",
        market: "Market share is estimated using market assumptions + survival runs.",
      };
    }
    return {
      product: "제품 자체의 힘: 차별성/품질/실현가능성/모방 방어.",
      founder: "창업자 역량: 실행/리더십/멘탈/설득/리소스 감각.",
      strategy: "시장/포지셔닝/진입 전략의 현실성.",
      marketing: "고객 획득력: 채널 적합, CAC 현실성, 성장 레버.",
      consumer_needs: "고객이 실제로 돈을 낼지(강도/긴급성/지불의사).",

      concept_fit: "컨셉 명확도/차별성/포지셔닝 적합.",
      price_fit: "가격의 합리성/지불의사/가격-가치 정합성.",
      business_model_fit: "BM/마진/단위경제 타당성.",
      distribution: "유통/채널 실행 난이도(운영·물류·파트너).",
      market_scope: "규제/경쟁/확장성(국가·세그·제품 확장 가능).",
      potential_customers: "지갑 있는 잠재고객 + 도달가능성.",

      funnel: "단계별로 어디서 제일 많이 망하는지. 막대 높을수록 그 구간이 지옥.",
      market: "시장점유율은 '시장가정 + 생존한 런' 기반으로 추정됩니다.",
    };
  }, [lang]);

  const buildManualMarketAssumptions = (): MarketAssumptionsInput | null => {
    const market_revenue = triFromStrings(mRevMin, mRevMode, mRevMax);
    const price = triFromStrings(mPriceMin, mPriceMode, mPriceMax);
    const purchase_freq_per_year = triFromStrings(mFreqMin, mFreqMode, mFreqMax);
    const max_penetration = triFromStrings(mPenMin, mPenMode, mPenMax);
    const market_customers = triFromStrings(mCustMin, mCustMode, mCustMax);

    // 최소 조건: 매출 또는 고객수 + (가격/빈도) 중 일부라도 있어야 계산이 의미 있음
    if (!market_revenue && !market_customers) return null;
    if (!max_penetration) return null;

    return {
      market_revenue: market_revenue ?? undefined,
      market_customers: market_customers ?? undefined,
      price: price ?? undefined,
      purchase_freq_per_year: purchase_freq_per_year ?? undefined,
      max_penetration: max_penetration ?? undefined,
    };
  };

  const runAnalysis = async () => {
    if (!itemCategory) {
      alert(lang === "ko" ? "품목/카테고리를 입력(선택)해주세요." : "Please select/enter a category.");
      return;
    }
    if (!productName || !productDesc) {
      alert(lang === "ko" ? "아이템 이름과 설명을 입력해주세요." : "Please enter product name and description.");
      return;
    }

    if (marketMode === "manual") {
      const m = buildManualMarketAssumptions();
      if (!m) {
        alert(
          lang === "ko"
            ? "직접 입력을 선택하셨습니다. 최소한 '시장매출(또는 고객수)' + '침투율 상한(0~1)'은 넣어주세요. (min/mode/max)"
            : "Manual mode: please provide at least market revenue(or customers) + max penetration (0~1) as min/mode/max."
        );
        return;
      }
    }

    setLoading(true);
    try {
      const marketAssumptions = marketMode === "manual" ? buildManualMarketAssumptions() : null;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          sellerInfo,
          buyerInfo,
          category: itemCategory,
          productInfo: {
            name: productName,
            desc: productDesc,
            category: itemCategory,
            concept,
            price: priceText,
            businessModel,
            salesChannel,
            salesCountry,
          },
          concept,
          price: priceText,
          businessModel,
          salesChannel,
          salesCountry,

          founderTraits,

          marketMode,
          ...(marketMode === "manual" && marketAssumptions ? { marketAssumptions } : {}),
        }),
      });

      const data = (await res.json()) as AnalysisResult;

      if (data?.success) {
        setResult(data);
        setStep("result");
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
  const StatBar = ({ label, value, icon: Icon, colorClass, barColor, tooltip }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold items-center text-zinc-300">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span className="inline-flex items-center">
            {label}
            <InfoTip text={tooltip} />
          </span>
        </div>
        <span className={colorClass}>{value}/100</span>
      </div>
      <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );

  const FunnelChart = ({ simulation }: { simulation: any }) => {
    const stages = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"];
    const deathCounts: Record<string, number> = simulation?.death_counts ?? simulation?.deathCounts ?? {};
    const deathRates: Record<string, number> = simulation?.death_rates ?? simulation?.deathRates ?? {};
    const stageSurvivalRates: Record<string, number> =
      simulation?.stage_survival_rates ?? simulation?.stageSurvivalRates ?? {};
    const stageEntries: Record<string, number> = simulation?.stage_entries ?? simulation?.stageEntries ?? {};
    const bottleneckStage: string =
      simulation?.bottleneck_stage ?? simulation?.bottleneckStage ?? simulation?.bottleneck ?? "";
    const survivalLabel = lang === "en" ? "survive" : "생존";
    const heatmapLabel = lang === "en" ? "Death heatmap (N)" : "사망자 히트맵(N)";
    const maxDeaths = Math.max(...(Object.values(deathCounts) as number[]), 1);

    return (
      <div className="space-y-3 mt-4">
        {stages.map((stage) => {
          const deaths = deathCounts[stage] || 0;
          const entries = stageEntries[stage] || 0;
          const isBottleneck = stage === bottleneckStage;
          const dropRate = Math.round(((deathRates[stage] ?? 0) * 100) * 10) / 10;
          const survivalRate = Math.round(((stageSurvivalRates[stage] ?? 0) * 100) * 10) / 10;
          const width = survivalRate;

          return (
            <div key={stage} className="space-y-2 text-sm text-zinc-300">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-bold">{stage}</span>
                <span>N={fmtInt(entries)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-6 bg-zinc-800 rounded-sm overflow-hidden relative">
                  <div
                    className={`h-full ${isBottleneck ? "bg-red-600" : "bg-zinc-600"} transition-all duration-1000`}
                    style={{ width: `${Math.max(width, deaths > 0 ? 2 : 0)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end px-2 text-xs font-bold text-white/80">
                    {deaths > 0 ? `☠️ ${fmtInt(deaths)} · ${dropRate}%` : ""}
                  </span>
                </div>
                <span className={`w-20 text-right font-bold ${isBottleneck ? "text-red-500" : "text-zinc-400"}`}>
                  {survivalRate}% {survivalLabel}
                </span>
              </div>
            </div>
          );
        })}
        <div className="mt-4 space-y-2">
          <div className="text-xs text-zinc-500">{heatmapLabel}</div>
          <div className="grid grid-cols-5 gap-2">
            {stages.map((stage) => {
              const deaths = deathCounts[stage] || 0;
              const intensity = Math.min(1, Math.max(0, deaths / maxDeaths));
              const bg = `rgba(239, 68, 68, ${0.15 + 0.75 * intensity})`;
              return (
                <div
                  key={`heat-${stage}`}
                  className="rounded-md border border-zinc-800 px-2 py-2 text-center text-xs font-bold text-white"
                  style={{ backgroundColor: bg }}
                  title={`${stage}: ${fmtInt(deaths)}`}
                >
                  <div className="text-[11px] text-white/80">{stage}</div>
                  <div className="text-sm">{fmtInt(deaths)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-center text-xs text-zinc-500 mt-2">
          {t.funnelDesc}
          <span className="ml-2 inline-block align-middle">
            <InfoTip text={statTooltips.funnel} />
          </span>
        </p>
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

  const PriceReferenceCard = ({ priceReference }: { priceReference?: AnalysisResult["priceReference"] | null }) => {
    if (!priceReference) {
      return <div className="text-xs text-zinc-500">{lang === "en" ? "No price reference data." : "가격 비교 데이터 없음"}</div>;
    }
    const min = Number(priceReference.min);
    const max = Number(priceReference.max);
    const userPrice = Number(priceReference.user_price);
    const hasRange = Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0 && min <= max;
    const hasUser = Number.isFinite(userPrice);

    if (!hasRange && !hasUser) {
      return <div className="text-xs text-zinc-500">{lang === "en" ? "No price reference data." : "가격 비교 데이터 없음"}</div>;
    }

    const range = hasRange ? max - min : 0;
    const position = hasRange && hasUser && range > 0 ? Math.max(0, Math.min(100, ((userPrice - min) / range) * 100)) : 0;
    const note = priceReference.currency_or_unit_note ? ` (${priceReference.currency_or_unit_note})` : "";
    const title = lang === "en" ? `Price reference range${note}` : `가격 적합도 참고 범위${note}`;
    const rangeLabel = lang === "en" ? "Comparable price range" : "유사 제품 가격 범위";
    const myPriceLabel = lang === "en" ? "Your price" : "내 가격";

    return (
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="text-sm font-bold text-zinc-200">{title}</div>
        {hasRange ? (
          <div className="mt-2 text-xs text-zinc-400">
            {rangeLabel}: {fmtInt(min)} ~ {fmtInt(max)}
          </div>
        ) : (
          <div className="mt-2 text-xs text-zinc-400">{rangeLabel}: -</div>
        )}
        <div className="mt-3">
          <div className="relative h-2 rounded-full bg-zinc-800">
            {hasRange && (
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/40 via-yellow-400/40 to-red-500/40"
              />
            )}
            {hasUser && hasRange && (
              <div
                className="absolute -top-1 h-4 w-0.5 bg-white"
                style={{ left: `calc(${position}% - 1px)` }}
              />
            )}
          </div>
          {hasUser ? (
            <div className="mt-2 text-xs text-zinc-300">
              {myPriceLabel}: <span className="font-bold text-white">{fmtInt(userPrice)}</span>
            </div>
          ) : (
            <div className="mt-2 text-xs text-zinc-500">{myPriceLabel}: -</div>
          )}
        </div>
      </div>
    );
  };

  const getFounderScore = (r: AnalysisResult | null) => {
    const s: any = r?.stats ?? {};
    return Number(s.founder ?? s.team ?? 0);
  };

  const survival = Number(result?.simulation?.survival_rate ?? result?.simulation?.survivalRate ?? 0);
  const bottleneck =
    result?.simulation?.bottleneck_stage ?? result?.simulation?.bottleneckStage ?? result?.simulation?.bottleneck ?? "-";

  // market extract helpers
  const marketNeeded = Boolean(result?.simulation?.market_needed ?? false);
  const marketShare = result?.simulation?.market_share ?? null;
  const marketLayers = result?.simulation?.market_layers ?? null;

  const revLayers = useMemo(() => {
    const rev = marketLayers?.revenue ?? {};
    const total = Number(rev?.total_market_p50 ?? rev?.total_market ?? 0);
    const sam = Number(rev?.addressable_sam_p50 ?? rev?.sam ?? 0);
    const som = Number(rev?.obtainable_som_p50 ?? rev?.som ?? 0);
    const you = Number(rev?.your_revenue_p50 ?? rev?.you ?? 0);
    return { total, sam, som, you };
  }, [marketLayers]);

  const shareP50 = Number(marketShare?.p50 ?? marketShare?.share_p50 ?? 0);
  const shareP10 = Number(marketShare?.p10 ?? marketShare?.share_p10 ?? 0);
  const shareP90 = Number(marketShare?.p90 ?? marketShare?.share_p90 ?? 0);
  const shareBand = String(marketShare?.band ?? marketShare?.audience_band ?? "");

  const MarketAreaBar = ({
    total,
    sam,
    som,
    you,
  }: {
    total: number;
    sam: number;
    som: number;
    you: number;
  }) => {
    const base = total > 0 ? total : 1;
    const samPct = Math.max(0, Math.min(100, (sam / base) * 100));
    const somPct = Math.max(0, Math.min(100, (som / base) * 100));
    const youPct = Math.max(0, Math.min(100, (you / base) * 100));

    return (
      <div className="space-y-3">
        <div className="h-10 bg-zinc-800 rounded-xl overflow-hidden relative border border-zinc-700">
          {/* total base */}
          <div className="absolute inset-0 bg-zinc-700/30" />

          {/* SAM overlay */}
          <div className="absolute inset-y-0 left-0 bg-blue-600/30" style={{ width: `${samPct}%` }} />

          {/* SOM overlay */}
          <div className="absolute inset-y-0 left-0 bg-orange-600/35" style={{ width: `${somPct}%` }} />

          {/* YOU overlay */}
          <div className="absolute inset-y-0 left-0 bg-red-600/55" style={{ width: `${youPct}%` }} />

          <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold text-white/90">
            <span>{t.marketGraphTitle}</span>
            <span>{total > 0 ? `Total=${fmtMoney(total)}` : ""}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
            <div className="text-zinc-400 text-xs font-bold">{t.marketTotal}</div>
            <div className="text-white font-extrabold mt-1">{fmtMoney(total)}</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
            <div className="text-zinc-400 text-xs font-bold">{t.marketSAM}</div>
            <div className="text-blue-200 font-extrabold mt-1">{fmtMoney(sam)}</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
            <div className="text-zinc-400 text-xs font-bold">{t.marketSOM}</div>
            <div className="text-orange-200 font-extrabold mt-1">{fmtMoney(som)}</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
            <div className="text-zinc-400 text-xs font-bold">{t.marketYou}</div>
            <div className="text-red-200 font-extrabold mt-1">{fmtMoney(you)}</div>
          </div>
        </div>
      </div>
    );
  };

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
            <div className="w-full flex justify-center">
              <div className="w-full max-w-4xl rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 shadow-2xl">
                <div className="px-4 py-3 text-sm md:text-base font-bold text-zinc-200 border-b border-zinc-800 bg-zinc-950/40">
                  <span className="text-red-400">{t.homeHint}</span>
                </div>

                <div className="relative">
                  <img src="/images/jjal.jpeg" alt="Startup Hell Meme" className="w-full h-auto object-cover" />
                  <div className="absolute bottom-3 right-3 text-[11px] md:text-xs px-2 py-1 rounded-md bg-black/60 text-zinc-200 border border-white/10">
                    hell-sim v2
                  </div>
                </div>
              </div>
            </div>

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
            <button onClick={() => setStep("home")} className="text-sm font-bold text-zinc-400 hover:text-white">
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
                  {/* ✅ 품목/카테고리 */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-red-400 block">{t.itemCategory}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={categoryPreset}
                        onChange={(e) => setCategoryPreset(e.target.value)}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="가전">{lang === "ko" ? "가전" : "Home Appliance"}</option>
                        <option value="생활용품">{lang === "ko" ? "생활용품" : "Household"}</option>
                        <option value="뷰티/화장품">{lang === "ko" ? "뷰티/화장품" : "Beauty/Cosmetics"}</option>
                        <option value="식품/음료">{lang === "ko" ? "식품/음료" : "Food/Beverage"}</option>
                        <option value="패션">{lang === "ko" ? "패션" : "Fashion"}</option>
                        <option value="SaaS/앱">{lang === "ko" ? "SaaS/앱" : "SaaS/App"}</option>
                        <option value="교육">{lang === "ko" ? "교육" : "Education"}</option>
                        <option value="헬스케어">{lang === "ko" ? "헬스케어" : "Healthcare"}</option>
                        <option value="핀테크">{lang === "ko" ? "핀테크" : "Fintech"}</option>
                        <option value="__custom__">{t.itemCategoryDirect}</option>
                      </select>

                      {categoryPreset === "__custom__" ? (
                        <input
                          type="text"
                          placeholder={t.itemCategoryDirectPlace}
                          value={categoryCustom}
                          onChange={(e) => setCategoryCustom(e.target.value)}
                          className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={t.itemCategoryPlace}
                          value={itemCategory}
                          readOnly
                          className="w-full p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-zinc-400"
                        />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {lang === "ko"
                        ? "품목은 가격/채널/국가 같은 현실 제약을 반영하기 위한 핵심 입력입니다."
                        : "Category helps apply real-world constraints."}
                    </p>
                  </div>

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

                  {/* optional fields (help auto market research + scoring) */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-zinc-300 block">{t.concept}</label>
                    <input
                      type="text"
                      placeholder={t.conceptPlace}
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 block">{t.price}</label>
                    <input
                      type="text"
                      placeholder={t.pricePlace}
                      value={priceText}
                      onChange={(e) => setPriceText(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 block">{t.businessModel}</label>
                    <input
                      type="text"
                      placeholder={t.businessModelPlace}
                      value={businessModel}
                      onChange={(e) => setBusinessModel(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 block">{t.salesChannel}</label>
                    <input
                      type="text"
                      placeholder={t.salesChannelPlace}
                      value={salesChannel}
                      onChange={(e) => setSalesChannel(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-300 block">{t.salesCountry}</label>
                    <input
                      type="text"
                      placeholder={t.salesCountryPlace}
                      value={salesCountry}
                      onChange={(e) => setSalesCountry(e.target.value)}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Market share section */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-extrabold text-white">{t.marketSectionTitle}</h3>
                    <InfoTip text={statTooltips.market} />
                  </div>

                  <div className="text-sm text-zinc-400 mb-4">{t.marketModeLabel}</div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setMarketMode("none")}
                      className={`p-4 rounded-xl border font-bold text-sm text-left transition ${
                        marketMode === "none"
                          ? "border-red-600 bg-red-600/20 text-white"
                          : "border-zinc-800 bg-zinc-950/30 text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      {t.marketModeNone}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMarketMode("auto")}
                      className={`p-4 rounded-xl border font-bold text-sm text-left transition ${
                        marketMode === "auto"
                          ? "border-blue-600 bg-blue-600/15 text-white"
                          : "border-zinc-800 bg-zinc-950/30 text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      {t.marketModeAuto}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMarketMode("manual")}
                      className={`p-4 rounded-xl border font-bold text-sm text-left transition ${
                        marketMode === "manual"
                          ? "border-orange-600 bg-orange-600/15 text-white"
                          : "border-zinc-800 bg-zinc-950/30 text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      {t.marketModeManual}
                    </button>
                  </div>

                  {marketMode === "manual" && (
                    <div className="mt-5 space-y-3">
                      <div className="text-xs text-zinc-500">{t.marketManualHint}</div>

                      {/* inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* market revenue */}
                        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
                          <div className="text-sm font-bold text-zinc-200 mb-2">
                            시장매출(연간) <span className="text-zinc-500 text-xs">(숫자)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={mRevMin}
                              onChange={(e) => setMRevMin(e.target.value)}
                              placeholder="min"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mRevMode}
                              onChange={(e) => setMRevMode(e.target.value)}
                              placeholder="mode"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mRevMax}
                              onChange={(e) => setMRevMax(e.target.value)}
                              placeholder="max"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                          </div>
                        </div>

                        {/* market customers */}
                        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
                          <div className="text-sm font-bold text-zinc-200 mb-2">
                            시장 고객수(연간 구매자) <span className="text-zinc-500 text-xs">(선택)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={mCustMin}
                              onChange={(e) => setMCustMin(e.target.value)}
                              placeholder="min"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mCustMode}
                              onChange={(e) => setMCustMode(e.target.value)}
                              placeholder="mode"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mCustMax}
                              onChange={(e) => setMCustMax(e.target.value)}
                              placeholder="max"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                          </div>
                        </div>

                        {/* price */}
                        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
                          <div className="text-sm font-bold text-zinc-200 mb-2">
                            평균 가격(1회 결제) <span className="text-zinc-500 text-xs">(숫자)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={mPriceMin}
                              onChange={(e) => setMPriceMin(e.target.value)}
                              placeholder="min"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mPriceMode}
                              onChange={(e) => setMPriceMode(e.target.value)}
                              placeholder="mode"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mPriceMax}
                              onChange={(e) => setMPriceMax(e.target.value)}
                              placeholder="max"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                          </div>
                        </div>

                        {/* freq */}
                        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
                          <div className="text-sm font-bold text-zinc-200 mb-2">
                            구매빈도(연/인) <span className="text-zinc-500 text-xs">(숫자)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={mFreqMin}
                              onChange={(e) => setMFreqMin(e.target.value)}
                              placeholder="min"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mFreqMode}
                              onChange={(e) => setMFreqMode(e.target.value)}
                              placeholder="mode"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mFreqMax}
                              onChange={(e) => setMFreqMax(e.target.value)}
                              placeholder="max"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                          </div>
                        </div>

                        {/* max penetration */}
                        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 md:col-span-2">
                          <div className="text-sm font-bold text-zinc-200 mb-2">
                            침투율 상한(0~1) <span className="text-zinc-500 text-xs">(필수, 예: 0.001 ~ 0.01)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={mPenMin}
                              onChange={(e) => setMPenMin(e.target.value)}
                              placeholder="min (0~1)"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mPenMode}
                              onChange={(e) => setMPenMode(e.target.value)}
                              placeholder="mode (0~1)"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <input
                              value={mPenMax}
                              onChange={(e) => setMPenMax(e.target.value)}
                              placeholder="max (0~1)"
                              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-500">
                        {lang === "ko"
                          ? "※ min/mode/max는 3점 추정(보수/가장 그럴듯/낙관)입니다. 숫자만 입력하세요."
                          : "min/mode/max is a 3-point estimate (low/most likely/high). Numbers only."}
                      </div>
                    </div>
                  )}

                  {marketMode === "auto" && (
                    <div className="mt-4 text-sm text-zinc-400">
                      {lang === "ko"
                        ? "자동 모드는 Tavily로 시장규모/가격/구매빈도 관련 정보를 검색하고, AI가 숫자(근거 포함)를 추출해 점유율을 계산합니다."
                        : "Auto mode uses Tavily + AI to extract numbers (with sources) and estimate market share."}
                    </div>
                  )}
                </div>

                {/* 창업자 특성 */}
                <div>
                  <h3 className="text-lg font-bold text-zinc-200 mb-4">{t.traitsTitle}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                    {Object.keys(t.traits).map((key) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <label className="font-bold text-zinc-300">{t.traits[key as keyof typeof t.traits]}</label>
                          <span className="text-red-400 font-bold">{founderTraits[key as keyof FounderTraits]}점</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={founderTraits[key as keyof FounderTraits]}
                          onChange={(e) => handleTraitChange(key as keyof FounderTraits, parseInt(e.target.value, 10))}
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
            STEP 3) RESULT
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
              <div className="grid w-full grid-cols-5 bg-zinc-800/50 p-1 rounded-lg mb-6">
                {(
                  [
                    ["summary", t.tabSummary],
                    ["autopsy", t.tabAutopsy],
                    ["voc", t.tabVoc],
                    ["market", t.tabMarket],
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
                        11 Stats
                      </h3>

                      <div className="grid grid-cols-1 gap-6">
                        {/* core 5 */}
                        <div className="space-y-6">
                          <StatBar
                            label={t.statProduct}
                            value={result.stats.product}
                            icon={IconShoppingCart}
                            colorClass="text-blue-400"
                            barColor="#60A5FA"
                            tooltip={statTooltips.product}
                          />
                          <StatBar
                            label={t.statFounder}
                            value={getFounderScore(result)}
                            icon={IconUsers}
                            colorClass="text-green-400"
                            barColor="#4ADE80"
                            tooltip={statTooltips.founder}
                          />
                          <StatBar
                            label={t.statStrategy}
                            value={result.stats.strategy}
                            icon={IconTarget}
                            colorClass="text-purple-400"
                            barColor="#C084FC"
                            tooltip={statTooltips.strategy}
                          />
                          <StatBar
                            label={t.statMarketing}
                            value={result.stats.marketing}
                            icon={IconTrendingUp}
                            colorClass="text-yellow-400"
                            barColor="#FACC15"
                            tooltip={statTooltips.marketing}
                          />
                          <StatBar
                            label={t.statNeeds}
                            value={result.stats.consumer_needs}
                            icon={IconHeart}
                            colorClass="text-red-400"
                            barColor="#F87171"
                            tooltip={statTooltips.consumer_needs}
                          />
                        </div>

                        <div className="h-px bg-zinc-800" />

                        {/* biz 5 */}
                        <div className="space-y-6">
                          <StatBar
                            label={t.statConcept}
                            value={result.stats.concept_fit}
                            icon={IconTarget}
                            colorClass="text-blue-300"
                            barColor="#93C5FD"
                            tooltip={statTooltips.concept_fit}
                          />
                          <StatBar
                            label={t.statPriceFit}
                            value={result.stats.price_fit}
                            icon={IconDollar}
                            colorClass="text-emerald-400"
                            barColor="#34D399"
                            tooltip={statTooltips.price_fit}
                          />
                          <StatBar
                            label={t.statBusinessModel}
                            value={result.stats.business_model_fit}
                            icon={IconCash}
                            colorClass="text-lime-400"
                            barColor="#A3E635"
                            tooltip={statTooltips.business_model_fit}
                          />
                          <StatBar
                            label={t.statDistribution}
                            value={result.stats.distribution}
                            icon={IconTruck}
                            colorClass="text-orange-400"
                            barColor="#FB923C"
                            tooltip={statTooltips.distribution}
                          />
                          <StatBar
                            label={t.statScope}
                            value={result.stats.market_scope}
                            icon={IconGlobe}
                            colorClass="text-purple-300"
                            barColor="#D8B4FE"
                            tooltip={statTooltips.market_scope}
                          />
                          <StatBar
                            label={t.statPotential}
                            value={result.stats.potential_customers}
                            icon={IconPie}
                            colorClass="text-rose-300"
                            barColor="#FDA4AF"
                            tooltip={statTooltips.potential_customers}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 h-full rounded-xl p-6">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                        <IconAlertTriangle className="w-5 h-5 text-red-500" />
                        {t.funnelTitle}
                        <InfoTip text={statTooltips.funnel} />
                      </h3>
                      <FunnelChart simulation={result.simulation} />
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">{t.cloudTitle}</h3>
                    <TagCloud words={keywords} />
                    <PriceReferenceCard priceReference={result?.priceReference} />
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
                      <ActionList text={result.report.action_plan} />
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

              {/* Market */}
              {activeTab === "market" && (
                <div className="space-y-6">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <IconPie className="w-6 h-6 text-red-400" />
                      {t.marketTabTitle}
                    </h3>
                    <div className="text-sm text-zinc-400">{t.marketShareNote}</div>

                    {marketNeeded && (
                      <div className="mt-4 p-4 rounded-xl border border-red-900/40 bg-red-950/20 text-red-200 text-sm font-bold">
                        {t.marketNeededMsg}
                      </div>
                    )}

                    {!marketNeeded && (
                      <>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
                            <div className="text-zinc-400 text-xs font-bold">{t.marketShareTitle}</div>
                            <div className="text-3xl font-extrabold text-red-300 mt-2">
                              {(shareP50 * 100).toFixed(2)}%
                            </div>
                            <div className="text-xs text-zinc-500 mt-2">
                              p10 {(shareP10 * 100).toFixed(2)}% · p90 {(shareP90 * 100).toFixed(2)}%
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
                            <div className="text-zinc-400 text-xs font-bold">Band</div>
                            <div className="text-2xl font-extrabold text-white mt-2">{shareBand || "-"}</div>
                            <div className="text-xs text-zinc-500 mt-2">
                              {result.report.market_takeaway ? cleanText(result.report.market_takeaway) : ""}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
                            <div className="text-zinc-400 text-xs font-bold">{t.marketAssumptionsTitle}</div>
                            <pre className="mt-2 text-xs text-zinc-300 whitespace-pre-wrap font-mono">
{JSON.stringify(result.marketAssumptionsUsed ?? null, null, 2)}
                            </pre>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="text-lg font-extrabold text-white mb-3">{t.marketGraphTitle}</h4>
                          <MarketAreaBar total={revLayers.total} sam={revLayers.sam} som={revLayers.som} you={revLayers.you} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Auto sources */}
                  {(result.marketSizingSources?.length ?? 0) > 0 && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">{t.marketSourcesTitle}</h3>
                      <div className="space-y-3">
                        {result.marketSizingSources!.slice(0, 6).map((c, i) => (
                          <a
                            key={i}
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 transition"
                          >
                            <div className="text-zinc-100 font-bold">{c.title}</div>
                            <div className="text-zinc-400 text-sm mt-2 line-clamp-3">{String(c.content ?? "").slice(0, 240)}...</div>
                            <div className="text-xs text-zinc-500 mt-2">링크 열기</div>
                          </a>
                        ))}
                      </div>

                      {result.marketAutoMeta && (
                        <div className="mt-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950/30">
                          <h4 className="text-sm font-extrabold text-white mb-2">{t.marketMetaTitle}</h4>
                          <div className="text-xs text-zinc-400">
                            <div className="mb-2">
                              <span className="font-bold text-zinc-300">assumed_fields:</span>{" "}
                              {(result.marketAutoMeta.assumed_fields ?? []).join(", ") || "-"}
                            </div>
                            <div className="whitespace-pre-wrap">{cleanText(result.marketAutoMeta.rationale ?? "")}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
