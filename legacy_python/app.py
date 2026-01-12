import os
import random
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import plotly.express as px
import streamlit as st
from tavily import TavilyClient

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

# Optional (번역/모델리스트용) - 설치되어 있으면 사용, 없어도 앱은 돌아가게 처리
try:
    from google import genai  # google-genai
except Exception:  # pragma: no cover
    genai = None


# =========================
# (맨 위) 환경변수 "하드코딩 슬롯"
# =========================
# ✅ 여기만 채우면, 앱 실행 시 자동으로 환경변수로 주입됩니다.
HARDCODE_GEMINI_API_KEY =   
HARDCODE_TAVILY_API_KEY =  

if (HARDCODE_GEMINI_API_KEY or "").strip():
    os.environ["GEMINI_API_KEY"] = HARDCODE_GEMINI_API_KEY.strip()
if (HARDCODE_TAVILY_API_KEY or "").strip():
    os.environ["TAVILY_API_KEY"] = HARDCODE_TAVILY_API_KEY.strip()


# =========================
# 0) 상수/설정
# =========================
STAGES = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"]
# ✅ 이미지 링크 교체(velog)
MEME_URL = "https://velog.velcdn.com/images/jaylaydown/post/46234814-6325-4982-b676-e89b851697f4/image.jpeg"
HERO_BG = "https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=1600&q=80"


# =========================
# 1) 스타일/레이아웃
# =========================
def apply_custom_style() -> None:
    st.markdown(
        f"""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

        /* 폭 제한: 찍찍 늘어지는 느낌 제거 */
        section.main > div.block-container {{
            max-width: 1100px;
            padding-top: 0.8rem;
            padding-bottom: 2.2rem;
        }}

        html, body, [class*="css"] {{
            font-family: 'Inter', sans-serif;
            background-color: #050505;
            color: #E0E0E0;
        }}

        /* Streamlit 기본 UI 숨김 */
        header[data-testid="stHeader"] {{ display: none; }}
        footer {{ visibility: hidden; }}
        #MainMenu {{ visibility: hidden; }}

        /* 상단 네비 */
        .topnav {{
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding: 6px 0 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            margin-bottom: 12px;
        }}
        .brand {{
            display:flex;
            align-items:center;
            gap:10px;
            font-weight: 900;
            letter-spacing: -0.3px;
            color: #f0f0f0;
            font-size: 1.05rem;
        }}
        .menu {{
            display:flex;
            gap:18px;
            align-items:center;
            color:#bdbdbd;
            font-weight: 700;
            font-size: 0.95rem;
        }}
        .menu a {{
            color:#bdbdbd;
            text-decoration:none;
        }}
        .menu a:hover {{
            color:#ffffff;
            text-decoration: underline;
        }}

        /* 히어로 */
        .hero {{
            position: relative;
            border-radius: 18px;
            overflow: hidden;
            height: 290px;
            background:
                linear-gradient(90deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%),
                url("{HERO_BG}");
            background-size: cover;
            background-position: center;
            border: 1px solid rgba(255,255,255,0.10);
        }}
        .hero-inner {{
            position:absolute;
            left: 24px;
            top: 50%;
            transform: translateY(-50%);
            max-width: 62%;
        }}
        .hero-title {{
            font-size: 2.05rem;
            font-weight: 900;
            letter-spacing: -0.6px;
            margin: 0;
            color: #ffffff;
        }}
        .hero-sub {{
            margin-top: 10px;
            color: #d0d0d0;
            line-height: 1.55;
            font-size: 1.0rem;
        }}
        .hero-pill {{
            display:inline-block;
            margin-top: 12px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            color: #eaeaea;
            font-weight: 700;
            font-size: 0.90rem;
        }}

        /* 밈 이미지(요청 링크) - 히어로에 “스티커”처럼 */
        .hero-meme {{
            position:absolute;
            right: 14px;
            bottom: 14px;
            width: 230px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 12px 28px rgba(0,0,0,0.55);
            transform: rotate(1.3deg);
        }}
        .meme-cap {{
            position:absolute;
            right: 14px;
            bottom: 252px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(0,0,0,0.55);
            border: 1px solid rgba(255,255,255,0.10);
            color: #f0f0f0;
            font-weight: 800;
            font-size: 0.86rem;
        }}

        /* CTA 버튼 */
        .stButton>button {{
            width: 100%;
            border-radius: 12px;
            background: linear-gradient(45deg, #FF4B2B, #FF416C);
            color: white;
            border: none;
            padding: 14px;
            font-weight: 900;
            transition: 0.25s;
        }}
        .stButton>button:hover {{
            transform: scale(1.01);
            box-shadow: 0 10px 18px rgba(255, 75, 43, 0.25);
        }}

        /* 섹션 타이틀 간격 */
        .section-gap {{
            margin-top: 18px;
        }}

        /* 라디오(언어 선택) 텍스트처럼 */
        div[data-testid="stRadio"] div[role="radiogroup"]{{
            display:flex;
            justify-content:flex-end;
            gap: 0rem;
        }}
        div[data-testid="stRadio"] input[type="radio"]{{
            display:none;
        }}
        div[data-testid="stRadio"] label{{
            margin: 0 !important;
            padding: 0 !important;
            cursor: pointer;
        }}
        div[data-testid="stRadio"] label span{{
            color: #9aa0a6;
            font-weight: 800;
            font-size: 0.95rem;
        }}
        div[data-testid="stRadio"] label:hover span{{
            color: #ffffff;
            text-decoration: underline;
        }}
        div[data-testid="stRadio"] label:has(input:checked) span{{
            color: #ffffff;
        }}
        div[data-testid="stRadio"] div[role="radiogroup"] > label:not(:last-child) span::after{{
            content: " | ";
            color: #555;
            padding: 0 0.55rem;
            text-decoration: none;
        }}

        /* 카드 스타일 */
        .card {{
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 16px;
            padding: 14px 14px;
            margin: 0 0 12px 0;
        }}
        .card-title {{
            font-weight: 900;
            font-size: 1.02rem;
            margin-bottom: 8px;
            color: #f0f0f0;
        }}
        .card-sub {{
            color: #bdbdbd;
            font-size: 0.95rem;
            line-height: 1.5;
        }}

        /* 카드 내부 링크 */
        .card a {{
            color: #FF416C;
            font-weight: 900;
            text-decoration: none;
        }}
        .card a:hover {{
            text-decoration: underline;
        }}

        /* 참고용 안내 박스 */
        .mini-note {{
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.10);
            color: #cfcfcf;
            line-height: 1.55;
            margin-top: 12px;
        }}

        @media (max-width: 900px){{
            .hero-inner {{ max-width: 92%; }}
            .hero-meme {{ width: 175px; }}
            .meme-cap {{ bottom: 200px; }}
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_top(language: str) -> None:
    title_map = {
        "ko": "💀 스타트업 지옥 시뮬레이터",
        "en": "💀 Startup Hell Simulator",
        "ja": "💀 スタートアップ地獄シミュレーター",
    }
    # ✅ KO 멘트 교체(요청)
    sub_map = {
        "ko": "안녕하세요. 오늘도 쓰레기를 들고 오셨네요.",
        "en": "How long until your idea hits the trash bin? 😇➡️🗑️",
        "ja": "あなたのアイデアがゴミ箱に行くまでの時間は？ 😇➡️🗑️",
    }

    st.markdown(
        f"""
        <div class="topnav">
            <div class="brand">{title_map.get(language, title_map["ko"])}</div>
            <div class="menu">
                <a href="#input">입력</a>
                <a href="#report">리포트</a>
                <a href="#cases">흑역사</a>
                <a href="#videos">영상</a>
            </div>
        </div>

        <div class="hero">
            <div class="hero-inner">
                <h1 class="hero-title">{title_map.get(language, title_map["ko"])}</h1>
                <div class="hero-sub">{sub_map.get(language, sub_map["ko"])}</div>
            </div>

            <div class="meme-cap">양심을 버리실 땐 → 우측 하단 참고</div>
            <img class="hero-meme" src="{MEME_URL}" />
        </div>
        """,
        unsafe_allow_html=True,
    )


def card_open(title: str) -> None:
    st.markdown(f'<div class="card"><div class="card-title">{title}</div>', unsafe_allow_html=True)


def card_close() -> None:
    st.markdown("</div>", unsafe_allow_html=True)


def _clamp_0_100(x: object) -> int:
    try:
        v = int(float(x))
    except Exception:
        v = 0
    return max(0, min(100, v))


def render_stat_fill_bars(stats: Dict[str, int], language: str) -> None:
    """
    ✅ '선거 점유율 채우듯이' 스탯이 몇 점/몇 %인지 한눈에 보이게 표시.
    - 좌담회 카드 안에서 바로 보여주기용
    """
    label_map = {
        "ko": {
            "product": "Product",
            "team": "Team",
            "strategy": "Strategy",
            "marketing": "Marketing",
            "consumer_needs": "Needs",
        },
        "en": {
            "product": "Product",
            "team": "Team",
            "strategy": "Strategy",
            "marketing": "Marketing",
            "consumer_needs": "Needs",
        },
        "ja": {
            "product": "Product",
            "team": "Team",
            "strategy": "Strategy",
            "marketing": "Marketing",
            "consumer_needs": "Needs",
        },
    }.get(language, {})

    keys = ["product", "team", "strategy", "marketing", "consumer_needs"]
    cols = st.columns(5)
    for i, k in enumerate(keys):
        v = _clamp_0_100(stats.get(k, 0))
        with cols[i]:
            st.caption(label_map.get(k, k))
            st.progress(v / 100.0)
            st.write(f"**{v}점 / {v}%**")


# =========================
# 2) API 키 로딩 (직접 입력만이 상책 아님)
# =========================
def resolve_api_keys(google_input: str, tavily_input: str) -> Tuple[str, str]:
    """
    사용자 입력이 없으면:
    - 환경변수 GEMINI_API_KEY / TAVILY_API_KEY
    - Streamlit secrets (GEMINI_API_KEY / TAVILY_API_KEY)
    순으로 읽습니다.
    """
    google_key = (google_input or "").strip()
    tavily_key = (tavily_input or "").strip()

    if not google_key:
        google_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not tavily_key:
        tavily_key = os.environ.get("TAVILY_API_KEY", "").strip()

    # Streamlit secrets (배포용)
    try:
        if not google_key and "GEMINI_API_KEY" in st.secrets:
            google_key = str(st.secrets["GEMINI_API_KEY"]).strip()
        if not tavily_key and "TAVILY_API_KEY" in st.secrets:
            tavily_key = str(st.secrets["TAVILY_API_KEY"]).strip()
    except Exception:
        pass

    return google_key, tavily_key


# =========================
# 3) Tavily 검색 + 결과 필터링
# =========================
def _looks_like_binary_or_garbage(text: str) -> bool:
    if not text:
        return True
    # XLS/바이너리/깨짐 흔한 패턴
    if "[XLS]" in text or "\x00" in text:
        return True
    # 깨진 문자( ) 비율이 높으면 드롭
    bad = text.count(" ")
    if bad >= 8:
        return True
    # 너무 비문자(제어문자) 많으면 드롭
    controls = sum(1 for ch in text if ord(ch) < 9)
    if controls > 0:
        return True
    # 알파뉴메릭/한글 비율이 너무 낮으면 드롭
    clean = re.sub(r"[A-Za-z0-9가-힣\s\.\,\-\(\)\[\]\!\?\:\/]", "", text)
    if len(clean) / max(1, len(text)) > 0.35:
        return True
    return False


@st.cache_data(show_spinner=False, ttl=60 * 20)
def get_market_data(query: str, tavily_key: str) -> str:
    if not tavily_key:
        return "Market data unavailable (No API Key)."
    try:
        client = TavilyClient(api_key=tavily_key)
        response = client.search(query=query, max_results=5, search_depth="advanced")
        results = response.get("results", []) or []
        lines = []
        for r in results:
            title = (r.get("title") or "Untitled").strip()
            content = (r.get("content") or "").strip()
            if _looks_like_binary_or_garbage(content):
                continue
            content = re.sub(r"\s+", " ", content)
            lines.append(f"- {title}: {content[:240]}")
        return "\n".join(lines) if lines else "No market data found."
    except Exception as exc:
        return f"Error fetching market data: {exc}"


@st.cache_data(show_spinner=False, ttl=60 * 30)
def get_market_autopsy(product: str, desc: str, tavily_key: str, max_results: int = 10) -> List[dict]:
    if not tavily_key:
        return []
    try:
        client = TavilyClient(api_key=tavily_key)
        q = f"{product} {desc} 실패 사례 망한 이유 경쟁사 리뷰 불만 후기"
        response = client.search(query=q, max_results=max_results, search_depth="advanced")
        raw = response.get("results", []) or []

        cleaned = []
        for r in raw:
            title = (r.get("title") or "").strip()
            url = (r.get("url") or "").strip()
            content = (r.get("content") or "").strip()
            if not title or not url or _looks_like_binary_or_garbage(content):
                continue
            content = re.sub(r"\s+", " ", content)
            cleaned.append({"title": title, "url": url, "content": content})

        # 중복 URL 제거
        seen = set()
        uniq = []
        for x in cleaned:
            if x["url"] in seen:
                continue
            seen.add(x["url"])
            uniq.append(x)
        return uniq
    except Exception:
        return []


def get_youtube_videos(queries: List[str], tavily_key: str, max_videos: int = 3) -> List[str]:
    if not tavily_key:
        return []
    client = TavilyClient(api_key=tavily_key)
    urls: List[str] = []
    seen = set()
    for q in queries:
        if not q.strip():
            continue
        try:
            resp = client.search(query=f"{q} site:youtube.com", max_results=2)
            results = resp.get("results", []) or []
            for r in results:
                u = (r.get("url") or "").strip()
                if not u or u in seen:
                    continue
                seen.add(u)
                urls.append(u)
                if len(urls) >= max_videos:
                    return urls
        except Exception:
            continue
    return urls[:max_videos]


# =========================
# 4) 모델/번역 (선택사항)
# =========================
@st.cache_data(show_spinner=False, ttl=60 * 60)
def _list_gemini_models(api_key: str) -> List[str]:
    if not genai or not api_key:
        return []
    try:
        client = genai.Client(api_key=api_key)
        names: List[str] = []
        for m in client.models.list():
            name = getattr(m, "name", "") or ""
            if name:
                names.append(name.replace("models/", ""))
        return names
    except Exception:
        return []


def resolve_gemini_model(model_name: str, api_key: str) -> str:
    requested = (model_name or "").strip() or "gemini-1.5-flash"
    normalized = requested.replace("models/", "")
    alias = {
        "gemini": "gemini-2.0-flash",
        "gemini-2.0": "gemini-2.0-flash",
        "gemini-1.5-pro-latest": "gemini-1.5-pro",
        "gemini-1.5-flash-latest": "gemini-1.5-flash",
    }
    normalized = alias.get(normalized, normalized)

    models = _list_gemini_models(api_key)
    if models:
        if normalized in models:
            return normalized
        for cand in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]:
            if cand in models:
                return cand
    return normalized


def translate_text(text: str, api_key: str, model_name: str, target_language: str) -> str:
    if not text or not api_key or not genai:
        return text
    model = resolve_gemini_model(model_name, api_key)
    client = genai.Client(api_key=api_key)

    prompt = f"""
Translate the following Korean text into {target_language}.
Keep names, numbers, and product terms intact.
Return plain text only.

Korean Text:
{text}
""".strip()
    try:
        resp = client.models.generate_content(model=model, contents=prompt)
        out = getattr(resp, "text", "") or ""
        return out.strip() or text
    except Exception:
        return text


# =========================
# 5) MCTS(몬테카를로) 시뮬레이션
# =========================
@dataclass
class SimulationResult:
    survival_rate: float
    death_counts: Dict[str, int]
    bottleneck_stage: str


class StartupMCTS:
    def __init__(self, iterations: int = 1000) -> None:
        self.iterations = iterations
        # 니즈 점수 consumer_needs: 초기 단계에서 특히 크게 반영
        self.stage_weights = {
            "Seed": {"product": 0.10, "team": 0.35, "strategy": 0.10, "marketing": 0.10, "consumer_needs": 0.35},
            "MVP": {"product": 0.20, "team": 0.25, "strategy": 0.10, "marketing": 0.10, "consumer_needs": 0.35},
            "PMF": {"product": 0.20, "team": 0.10, "strategy": 0.20, "marketing": 0.20, "consumer_needs": 0.30},
            "Scale-up": {"product": 0.20, "team": 0.20, "strategy": 0.30, "marketing": 0.25, "consumer_needs": 0.05},
            "Unicorn": {"product": 0.20, "team": 0.10, "strategy": 0.30, "marketing": 0.35, "consumer_needs": 0.05},
        }
        self.stage_difficulty = {"Seed": 0.70, "MVP": 0.60, "PMF": 0.50, "Scale-up": 0.40, "Unicorn": 0.30}

    def _stage_survival_prob(self, stats: Dict[str, int], stage: str) -> float:
        weights = self.stage_weights[stage]
        score = sum((stats.get(k, 0) or 0) * w for k, w in weights.items()) / sum(weights.values())
        base = score / 100.0
        return max(0.0, min(1.0, base * self.stage_difficulty[stage]))

    def _rollout(self, stats: Dict[str, int]) -> Optional[str]:
        for stage in STAGES:
            if random.random() > self._stage_survival_prob(stats, stage):
                return stage
        return None

    def run(self, stats: Dict[str, int]) -> SimulationResult:
        death_counts = {s: 0 for s in STAGES}
        survivors = 0
        for _ in range(self.iterations):
            d = self._rollout(stats)
            if d is None:
                survivors += 1
            else:
                death_counts[d] += 1
        bottleneck = max(death_counts, key=death_counts.get)
        survival = (survivors / self.iterations) * 100.0
        return SimulationResult(survival_rate=survival, death_counts=death_counts, bottleneck_stage=bottleneck)


# =========================
# 6) LangChain 체인 (스탯+부검+좌담)
# =========================
def analyze_stats_chain(
    api_key: str,
    model_name: str,
    seller_info: str,
    buyer_info: str,
    product_info: str,
    market_data: str,
) -> Dict[str, int]:
    parser = JsonOutputParser()
    prompt = PromptTemplate(
        template=(
            "너는 냉소적인 스타트업 검증관이다.\n"
            "입력 정보와 시장 데이터를 보고 5대 스탯을 0~100 정수로 계산해라.\n"
            "consumer_needs는 '요즘 소비자의 결핍'과 '이 아이템의 해결 일치율'이다.\n"
            "반드시 한국어로 사고하되, 출력은 JSON 스키마만 따른다.\n"
            "{format_instructions}\n"
            "JSON 필드: product, team, strategy, marketing, consumer_needs\n"
            "판매자: {seller_info}\n"
            "타겟: {buyer_info}\n"
            "아이템: {product_info}\n"
            "시장 데이터:\n{market_data}\n"
        ),
        input_variables=["seller_info", "buyer_info", "product_info", "market_data"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    llm = ChatGoogleGenerativeAI(
        model=resolve_gemini_model(model_name, api_key),
        google_api_key=api_key,
        temperature=0.2,
    )
    chain = prompt | llm | parser
    out = chain.invoke(
        {
            "seller_info": seller_info,
            "buyer_info": buyer_info,
            "product_info": product_info,
            "market_data": market_data,
        }
    )
    out.setdefault("consumer_needs", 0)

    # ✅ 방어적으로 정수화
    clean = {
        "product": _clamp_0_100(out.get("product", 0)),
        "team": _clamp_0_100(out.get("team", 0)),
        "strategy": _clamp_0_100(out.get("strategy", 0)),
        "marketing": _clamp_0_100(out.get("marketing", 0)),
        "consumer_needs": _clamp_0_100(out.get("consumer_needs", 0)),
    }
    return clean


def autopsy_report_chain(
    api_key: str,
    model_name: str,
    stats: Dict[str, int],
    bottleneck_stage: str,
    market_data: str,
) -> Dict[str, str]:
    parser = JsonOutputParser()
    prompt = PromptTemplate(
        template=(
            "너는 냉소적이고 현실적인 디스토피아 VC다.\n"
            "시뮬레이션 결과와 시장 데이터를 바탕으로 아래를 작성하라.\n"
            "반드시 한국어로 작성하고 JSON만 출력한다.\n"
            "{format_instructions}\n"
            "JSON 필드: death_cause, autopsy_report, action_plan, needs_analysis, youtube_queries\n"
            "- needs_analysis: 요즘 소비자가 진짜 원하는 것 vs 이 아이템이 놓친 포인트(한 문장 팩폭)\n"
            "- youtube_queries: 참고할 유튜브 검색어 3개(배열)\n"
            "스탯: {stats}\n"
            "가장 많이 죽은 단계: {bottleneck_stage}\n"
            "시장 데이터:\n{market_data}\n"
        ),
        input_variables=["stats", "bottleneck_stage", "market_data"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    llm = ChatGoogleGenerativeAI(
        model=resolve_gemini_model(model_name, api_key),
        google_api_key=api_key,
        temperature=0.35,
    )
    chain = prompt | llm | parser
    out = chain.invoke(
        {
            "stats": stats,
            "bottleneck_stage": bottleneck_stage,
            "market_data": market_data,
        }
    )
    # youtube_queries 방어
    if "youtube_queries" not in out or not isinstance(out["youtube_queries"], list):
        out["youtube_queries"] = []
    out["youtube_queries"] = [str(x)[:80] for x in out["youtube_queries"] if str(x).strip()][:3]
    return out


def run_panel_debate(
    api_key: str,
    model_name: str,
    stats: Dict[str, int],
    product_info: str,
) -> str:
    prompt = f"""
아래 스타트업 스탯과 정보를 보고 3명의 전문가가 독설 좌담회를 열어라.
1) 마포구 VC (냉소적, 수치/리스크 집착)
2) 테헤란로 창업가 (현실적, 피곤함이 기본값)
3) 까칠한 얼리어답터 (사용자 입장, 가성비/귀찮음 혐오)

아이템: {product_info}
스탯: {stats}

규칙:
- 반드시 한국어 대화체
- 각 캐릭터 말투 구분 확실히
- 마지막에 "결론: 한 줄"로 종합 판정
""".strip()
    model = ChatGoogleGenerativeAI(
        model=resolve_gemini_model(model_name, api_key),
        google_api_key=api_key,
        temperature=0.45,
    )
    return model.invoke(prompt).content


# =========================
# 7) 메인
# =========================
def main() -> None:
    st.set_page_config(page_title="Startup Hell", page_icon="💀", layout="wide")
    apply_custom_style()

    # 언어
    if "language" not in st.session_state:
        st.session_state.language = "ko"

    lang_display_to_code = {"한국어": "ko", "English": "en", "日本語": "ja"}
    lang_code_to_display = {v: k for k, v in lang_display_to_code.items()}

    # 맨 위: 오른쪽 언어 선택 (회색 텍스트)
    _, top_r = st.columns([7, 3])
    with top_r:
        choice = st.radio(
            # ✅ label 빈값 금지 경고 해결: 라벨은 넣고 숨김 처리
            label="Language",
            options=["한국어", "English", "日本語"],
            index=["한국어", "English", "日本語"].index(lang_code_to_display.get(st.session_state.language, "한국어")),
            horizontal=True,
            label_visibility="collapsed",
            key="lang_choice",
        )
        st.session_state.language = lang_display_to_code[choice]

    language = st.session_state.language

    # 상단 네비 + 히어로
    render_top(language)

    # 번역 테이블(라벨)
    t = {
        "ko": {
            "api_keys": "🔑 API 키",
            "google_key": "Gemini API Key",
            "tavily_key": "Tavily API Key",
            "api_hint": "키 입력이 귀찮으시면: 환경변수 GEMINI_API_KEY / TAVILY_API_KEY 또는 .streamlit/secrets.toml로 넣으세요 😈",
            "model_label": "Gemini Model",
            "seller_title": "🙋‍♂️ 판매자(나)",
            "seller_age": "연령대",
            "seller_style": "나의 성향/약점",
            "buyer_title": "🎯 타겟(너)",
            "buyer_age": "타겟 연령대",
            "buyer_traits": "타겟 특징",
            "product_title": "📦 아이템(그것)",
            "product_name": "아이템명",
            "product_price": "가격",
            "product_desc": "상세 원리 및 핵심 기능",
            "run_button": "🔥 지옥불 시뮬레이션 시작",
            "need_keys": "API 키가 필요합니다. (입력하거나 env/secrets에 넣어주세요)",
            "market_spinner": "🔍 시장 트렌드 수색 중...",
            "case_spinner": "🕵️ 과거의 흑역사(망한 사례) 주워오는 중...",
            "stat_spinner": "🧪 5대 스탯(니즈 포함) 계산 중...",
            "sim_spinner": "☠️ 확률적으로 죽여보는 중...",
            "autopsy_spinner": "🧾 부검 보고서 쓰는 중...",
            "debate_spinner": "🗣️ 전문가들이 물어뜯는 중...",
            "report_title": "📊 폐업 신고서(가상)",
            "survival_rate": "생존 확률",
            "death_cause": "사망 원인",
            "needs_title": "🎯 소비자 니즈 일치도",
            "needs_ai": "AI 팩폭",
            "autopsy": "🧪 부검 소견",
            "action_plan": "🩸 최후의 발악",
            "bottleneck": "가장 많이 죽은 구간",
            "funnel_title": "☠️ 죽음의 깔때기",
            "cases_title": "🔗 참고할 과거 흑역사",
            "debate_title": "💬 지옥의 좌담회",
            "videos_title": "📺 참고 영상(2~3개)",
            "no_video": "적절한 영상을 못 찾았습니다.",
            "parse_fail": "분석이 꼬였습니다. 다시 돌려보세요.",
        },
        "en": {
            "api_keys": "🔑 API Keys",
            "google_key": "Gemini API Key",
            "tavily_key": "Tavily API Key",
            "api_hint": "Set env vars GEMINI_API_KEY / TAVILY_API_KEY or Streamlit secrets 😈",
            "model_label": "Gemini Model",
            "seller_title": "🙋‍♂️ Seller (Me)",
            "seller_age": "Age Range",
            "seller_style": "Traits/Weaknesses",
            "buyer_title": "🎯 Target (You)",
            "buyer_age": "Target Age Range",
            "buyer_traits": "Target Traits",
            "product_title": "📦 Item (It)",
            "product_name": "Item Name",
            "product_price": "Price",
            "product_desc": "How it works / Core features",
            "run_button": "🔥 Start Hell Simulation",
            "need_keys": "API keys required (input or env/secrets).",
            "market_spinner": "🔍 Scanning market trends...",
            "case_spinner": "🕵️ Collecting failure cases...",
            "stat_spinner": "🧪 Calculating stats (incl. needs)...",
            "sim_spinner": "☠️ Rolling the dice...",
            "autopsy_spinner": "🧾 Writing autopsy report...",
            "debate_spinner": "🗣️ Panel roasting in progress...",
            "report_title": "📊 Shutdown Report (Fiction)",
            "survival_rate": "Survival Rate",
            "death_cause": "Cause of Death",
            "needs_title": "🎯 Consumer Needs Match",
            "needs_ai": "AI roast",
            "autopsy": "🧪 Autopsy",
            "action_plan": "🩸 Last-Ditch Plan",
            "bottleneck": "Biggest Bottleneck",
            "funnel_title": "☠️ Death Funnel",
            "cases_title": "🔗 Failure case links",
            "debate_title": "💬 Hell Panel Debate",
            "videos_title": "📺 Reference Videos (2–3)",
            "no_video": "No suitable video found.",
            "parse_fail": "Analysis failed. Try again.",
        },
        "ja": {
            "api_keys": "🔑 APIキー",
            "google_key": "Gemini API Key",
            "tavily_key": "Tavily API Key",
            "api_hint": "環境変数 GEMINI_API_KEY / TAVILY_API_KEY または secrets を利用できます 😈",
            "model_label": "Gemini Model",
            "seller_title": "🙋‍♂️ 販売者（私）",
            "seller_age": "年齢層",
            "seller_style": "性格/弱点",
            "buyer_title": "🎯 ターゲット（あなた）",
            "buyer_age": "ターゲット年齢層",
            "buyer_traits": "ターゲット特性",
            "product_title": "📦 アイテム（それ）",
            "product_name": "アイテム名",
            "product_price": "価格",
            "product_desc": "仕組み / 核心機能",
            "run_button": "🔥 地獄シミュレーション開始",
            "need_keys": "APIキーが必要です（入力または env/secrets）。",
            "market_spinner": "🔍 市場トレンド検索中...",
            "case_spinner": "🕵️ 失敗事例収集中...",
            "stat_spinner": "🧪 スコア計算中（ニーズ含む）...",
            "sim_spinner": "☠️ サイコロ回し中...",
            "autopsy_spinner": "🧾 検死レポート作成中...",
            "debate_spinner": "🗣️ パネルがボコる中...",
            "report_title": "📊 廃業レポート（架空）",
            "survival_rate": "生存確率",
            "death_cause": "死亡原因",
            "needs_title": "🎯 消費者ニーズ一致度",
            "needs_ai": "AIツッコミ",
            "autopsy": "🧪 検死所見",
            "action_plan": "🩸 最後の悪あがき",
            "bottleneck": "最も死んだ区間",
            "funnel_title": "☠️ 死のファネル",
            "cases_title": "🔗 失敗事例リンク",
            "debate_title": "💬 地獄の座談会",
            "videos_title": "📺 参考動画（2〜3本）",
            "no_video": "適切な動画が見つかりませんでした。",
            "parse_fail": "分析に失敗しました。もう一度お試しください。",
        },
    }[language]

    # 사이드바: 키/모델
    with st.sidebar:
        st.header(t["api_keys"])
        google_input = st.text_input(t["google_key"], type="password", placeholder="(선택) env/secrets에 있으면 생략 가능")
        tavily_input = st.text_input(t["tavily_key"], type="password", placeholder="(선택) env/secrets에 있으면 생략 가능")
        # ✅ '키 입력이 귀찮으시면...' 문구는 UI에서 안 보이게 처리 (요청)
        # st.caption(t["api_hint"])
        model_name = st.text_input(t["model_label"], value="gemini-1.5-flash")

    google_api_key, tavily_api_key = resolve_api_keys(google_input, tavily_input)

    # 입력 섹션 앵커
    st.markdown('<div id="input"></div>', unsafe_allow_html=True)
    st.markdown('<div class="section-gap"></div>', unsafe_allow_html=True)

    # ✅ 입력도 카드형 + 그리드 (2~3개)
    input_cols = st.columns(2)
    with input_cols[0]:
        card_open(t["seller_title"])
        seller_age = st.selectbox(t["seller_age"], ["10대", "20대", "30대", "40대", "50대", "60대 이상"])
        seller_style = st.text_input(t["seller_style"], placeholder="예: 미래 계획에 약함 / 귀찮음 / 말만 번지르르")
        card_close()

    with input_cols[1]:
        card_open(t["buyer_title"])
        buyer_age = st.selectbox(t["buyer_age"], ["10대", "20대", "30대", "40대", "50대", "60대 이상"])
        buyer_traits = st.text_input(t["buyer_traits"], placeholder="예: 가성비 중시 / 인스타 중독 / 귀여운 거에 약함")
        card_close()

    # 아이템 카드
    card_open(t["product_title"])
    p1, p2 = st.columns([3, 1])
    with p1:
        product_name = st.text_input(t["product_name"], placeholder="예: 사무실용 자동 핸드워시 디스펜서")
    with p2:
        product_price = st.text_input(t["product_price"], placeholder="예: 31,080원")
    product_desc = st.text_area(t["product_desc"], placeholder="예: 센서로 자동 분사, 거품/액상 모두 지원, 리필 쉬움", height=140)
    card_close()

    st.markdown(
        """
        <div class="mini-note">
        ✅ 팁: "대충 좋은 제품"이라고 쓰면 AI도 대충 팹니다. <b>구체적으로</b> 쓰실수록 더 아프게 맞습니다 😇🔨<br/>
        ✅ 그리고… <b>API 키를 사용자에게 직접 입력받는 방식만이 상책은 아닙니다.</b><br/>
        &nbsp;&nbsp;→ 배포할 땐 <code>환경변수</code> 또는 <code>Streamlit secrets</code>로 숨기는 게 정석입니다. (유출 방지)
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 실행
    if st.button(t["run_button"]):
        if not google_api_key or not tavily_api_key:
            st.error(t["need_keys"])
            st.stop()

        seller_info = f"{seller_age}, {seller_style}"
        buyer_info = f"{buyer_age}, {buyer_traits}"
        product_info = f"{product_name}, {product_desc}, {product_price}"

        # 1) 시장 트렌드 / 흑역사
        with st.spinner(t["market_spinner"]):
            market_data = get_market_data(f"{product_name} 시장 트렌드 소비자 불만 니즈", tavily_api_key)
        with st.spinner(t["case_spinner"]):
            past_cases = get_market_autopsy(product_name, product_desc, tavily_api_key, max_results=12)

        # 2) 스탯
        try:
            with st.spinner(t["stat_spinner"]):
                stats = analyze_stats_chain(
                    google_api_key,
                    model_name,
                    seller_info,
                    buyer_info,
                    product_info,
                    market_data,
                )
        except Exception:
            st.error(t["parse_fail"])
            st.stop()

        # 3) 시뮬
        with st.spinner(t["sim_spinner"]):
            mcts = StartupMCTS(iterations=1200)
            simulation = mcts.run(stats)

        # 4) 부검 리포트 + 니즈분석 + 유튜브 검색어 3개
        try:
            with st.spinner(t["autopsy_spinner"]):
                autopsy = autopsy_report_chain(
                    google_api_key,
                    model_name,
                    stats,
                    simulation.bottleneck_stage,
                    market_data,
                )
        except Exception:
            st.error(t["parse_fail"])
            st.stop()

        # 5) 좌담회
        with st.spinner(t["debate_spinner"]):
            debate = run_panel_debate(google_api_key, model_name, stats, product_info)

        # 6) 유튜브 2~3개
        youtube_queries = autopsy.get("youtube_queries", []) or []
        if not youtube_queries:
            youtube_queries = [f"{product_name} 시장 분석", f"{product_name} 창업 실패 사례", "PMF 찾는 법"]
        video_urls = get_youtube_videos(youtube_queries, tavily_api_key, max_videos=3)

        # 결과 앵커
        st.markdown('<div id="report"></div>', unsafe_allow_html=True)
        st.markdown('<div class="section-gap"></div>', unsafe_allow_html=True)

        st.header(t["report_title"])

        # ✅ 상단 요약: 4개 카드 그리드
        stage_labels = {
            "ko": {"Seed": "시드", "MVP": "MVP", "PMF": "PMF", "Scale-up": "스케일업", "Unicorn": "유니콘"},
            "en": {"Seed": "Seed", "MVP": "MVP", "PMF": "PMF", "Scale-up": "Scale-up", "Unicorn": "Unicorn"},
            "ja": {"Seed": "シード", "MVP": "MVP", "PMF": "PMF", "Scale-up": "スケールアップ", "Unicorn": "ユニコーン"},
        }[language]
        bottleneck_label = stage_labels.get(simulation.bottleneck_stage, simulation.bottleneck_stage)

        needs_score = _clamp_0_100(stats.get("consumer_needs", 0))

        r1 = st.columns(4)
        with r1[0]:
            card_open(t["survival_rate"])
            st.metric(t["survival_rate"], f"{simulation.survival_rate:.1f}%")
            card_close()
        with r1[1]:
            card_open("Needs")
            st.metric("Needs", f"{needs_score}/100")
            card_close()
        with r1[2]:
            card_open(t["bottleneck"])
            st.metric(t["bottleneck"], bottleneck_label)
            card_close()
        with r1[3]:
            card_open(t["death_cause"])
            st.write(f"**{t['death_cause']}:** {autopsy.get('death_cause', 'N/A')}")
            card_close()

        # ✅ 4대 스탯: 한 줄 4개 카드
        srow = st.columns(4)
        for i, key in enumerate(["product", "team", "strategy", "marketing"]):
            with srow[i]:
                card_open(key.capitalize())
                st.metric(key.capitalize(), f"{_clamp_0_100(stats.get(key, 0))}/100")
                card_close()

        # ✅ 니즈 섹션도 카드화(내용 동일)
        card_open(t["needs_title"])
        st.progress(needs_score / 100.0)
        st.write(f"**{t['needs_ai']}:** {autopsy.get('needs_analysis', 'N/A')}")
        card_close()

        # ✅ 본문 리포트: 2열 그리드 카드 (부검/액션)
        body_cols = st.columns(2)
        with body_cols[0]:
            card_open(t["autopsy"])
            st.write(autopsy.get("autopsy_report", "N/A"))
            card_close()
        with body_cols[1]:
            card_open(t["action_plan"])
            st.write(autopsy.get("action_plan", "N/A"))
            card_close()

        # ✅ 좌담회/차트도 카드형
        card_open(t["debate_title"])

        # ✅ 여기 추가: 좌담회 직전에 스탯이 "점유율 채우듯" 보이게
        render_stat_fill_bars(stats, language)
        st.markdown("---")
        st.write(debate)

        card_close()

        card_open(t["funnel_title"])
        funnel_data = {
            "Stage": [stage_labels.get(s, s) for s in simulation.death_counts.keys()],
            "Deaths": list(simulation.death_counts.values()),
        }
        fig = px.bar(
            funnel_data,
            x="Deaths",
            y="Stage",
            orientation="h",
            title="단계별로 얼마나 잘 죽는지(높을수록 잘 죽음) 🪦",
        )
        fig.update_layout(
            height=380,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="white",
        )
        st.plotly_chart(fig, use_container_width=True)
        card_close()

        # ✅ 참고 사례: 그리드 카드 (한 줄 3~4개)
        st.markdown('<div id="cases"></div>', unsafe_allow_html=True)
        st.subheader(t["cases_title"])

        if past_cases:
            # 12개까지 그리드로 보여주기 (4열)
            max_show = min(12, len(past_cases))
            cols_per_row = 4
            rows = (max_show + cols_per_row - 1) // cols_per_row

            idx = 0
            for _ in range(rows):
                cols = st.columns(cols_per_row)
                for c in cols:
                    if idx >= max_show:
                        break
                    case = past_cases[idx]
                    title = case.get("title", "Untitled")
                    url = case.get("url", "#")
                    content = (case.get("content", "") or "").strip()
                    content = content[:160] + ("..." if len(content) > 160 else "")

                    with c:
                        card_open("🔗")
                        st.markdown(f"[{title}]({url})")
                        st.markdown(f"<div class='card-sub'>{content}</div>", unsafe_allow_html=True)
                        card_close()
                    idx += 1

            # 더 있으면 expander 안에서 그리드(4열)
            if len(past_cases) > max_show:
                with st.expander(f"흑역사 더 보기… ({len(past_cases) - max_show}개)"):
                    rest = past_cases[max_show:]
                    cols_per_row = 4
                    rows = (len(rest) + cols_per_row - 1) // cols_per_row
                    idx2 = 0
                    for _ in range(rows):
                        cols = st.columns(cols_per_row)
                        for c in cols:
                            if idx2 >= len(rest):
                                break
                            case = rest[idx2]
                            title = case.get("title", "Untitled")
                            url = case.get("url", "#")
                            content = (case.get("content", "") or "").strip()
                            content = content[:160] + ("..." if len(content) > 160 else "")
                            with c:
                                card_open("🔗")
                                st.markdown(f"[{title}]({url})")
                                st.markdown(f"<div class='card-sub'>{content}</div>", unsafe_allow_html=True)
                                card_close()
                            idx2 += 1
        else:
            st.caption("관련 사례를 찾지 못했습니다. (또는 깨진/XLS 같은 결과는 자동으로 버렸습니다 😇)")

        # ✅ 영상: 그리드 카드 (2열)
        st.markdown('<div id="videos"></div>', unsafe_allow_html=True)
        st.subheader(t["videos_title"])
        if video_urls:
            vcols = st.columns(2)
            for i, u in enumerate(video_urls):
                with vcols[i % 2]:
                    card_open("📺")
                    st.video(u)
                    card_close()
            st.caption("검색어: " + " / ".join(youtube_queries[:3]))
        else:
            st.warning(t["no_video"])


if __name__ == "__main__":
    main()
