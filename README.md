# 스타트업 아이디어 평가 툴

> **"당신의 빛나는 아이디어가 쓰레기통으로 가기까지 걸리는 시간은? "**

Next.js와 생성형 AI(Gemini)를 활용한 스타트업 생존 확률 분석기입니다.
단순한 운세 보기가 아니라, 실시간 시장 데이터 검색(Tavily)과 MCTS(몬테카를로 트리 탐색) 알고리즘을 결합하여 가상의 스타트업 시나리오를 시뮬레이션합니다.

## ✨ 주요 기능

- **🔥 시뮬레이션:** 사용자 입력(판매자, 타겟, 아이템)을 바탕으로 생존 확률을 계산합니다.
- **🔍 실시간 시장 분석:** Tavily API를 통해 실제 웹상의 경쟁사 불만, 실패 사례, 시장 트렌드를 실시간으로 검색합니다.
- **🧠 AI 기반 스탯 산출:** 검색된 데이터를 Gemini-1.5-flash가 분석하여 Product, Team, Strategy, Marketing, Consumer Needs 5대 스탯을 도출합니다.
- **☠️ 데스 밸리(Death Valley) 예측:** MCTS 알고리즘을 통해 시드(Seed) 단계부터 유니콘(Unicorn)까지 어느 단계에서 폐업할지 1,200번 시뮬레이션합니다.
- **🧾 좌담회:** 왜 망했는지에 대한 상세한 분석과, 3명의 AI 페르소나(VC, 창업가, 얼리어답터)가 나누는 살벌한 좌담회를 제공합니다.

## 🛠 기술 스택 (Tech Stack)

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Model:** Google Gemini 1.5 Flash (`@langchain/google-genai`)
- **Search Engine:** Tavily Search API (`@tavily/core`)
- **Logic:** LangChain.js, Custom MCTS Class
- **Visualization:** Recharts
- **Deployment:** Vercel
