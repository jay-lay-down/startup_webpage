"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Share2, Terminal, AlertTriangle, ExternalLink, PlayCircle } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    sellerAge: "30대",
    sellerStyle: "",
    buyerAge: "20대",
    buyerTraits: "",
    productName: "",
    productDesc: "",
    productPrice: "",
  });

  const handleRun = async () => {
    if (!formData.productName || !formData.productDesc) {
      alert("아이템 이름과 설명은 필수입니다!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerInfo: `${formData.sellerAge}, ${formData.sellerStyle}`,
          buyerInfo: `${formData.buyerAge}, ${formData.buyerTraits}`,
          productInfo: {
            name: formData.productName,
            desc: formData.productDesc,
            price: formData.productPrice,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        alert("분석 실패: " + data.error);
      }
    } catch (e) {
      alert("서버 연결 에러");
    } finally {
      setLoading(false);
    }
  };

  const funnelData = result ? Object.keys(result.simulation.deathCounts).map(key => ({
    name: key,
    value: result.simulation.deathCounts[key]
  })) : [];

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <header className="mb-10 text-center space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-red-900/30 text-red-400 text-xs font-bold border border-red-900/50 mb-2">
            WARNING: BRUTAL REALITY
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            💀 스타트업 <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">지옥 시뮬레이터</span>
          </h1>
          <p className="text-gray-400 text-lg">
            당신의 아이디어가 쓰레기통으로 가기까지: <span className="font-mono text-yellow-500">계산 중...</span>
          </p>
        </header>

        {/* Input Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card title="🙋‍♂️ 판매자 (나)">
            <Select label="연령대" value={formData.sellerAge} onChange={(e) => setFormData({...formData, sellerAge: e.target.value})} options={["10대", "20대", "30대", "40대", "50대 이상"]} />
            <Input label="성향/약점" placeholder="예: 귀찮음이 많음, 실행력 부족" value={formData.sellerStyle} onChange={(e) => setFormData({...formData, sellerStyle: e.target.value})} />
          </Card>

          <Card title="🎯 타겟 (너)">
            <Select label="연령대" value={formData.buyerAge} onChange={(e) => setFormData({...formData, buyerAge: e.target.value})} options={["10대", "20대", "30대", "40대", "50대 이상"]} />
            <Input label="특징" placeholder="예: 가성비충, 인스타 중독" value={formData.buyerTraits} onChange={(e) => setFormData({...formData, buyerTraits: e.target.value})} />
          </Card>

          <Card title="📦 아이템 (그것)" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <div className="md:col-span-3">
                <Input label="아이템명" placeholder="예: AI기반 자동 칫솔" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} />
              </div>
              <Input label="가격" placeholder="예: 35,000원" value={formData.productPrice} onChange={(e) => setFormData({...formData, productPrice: e.target.value})} />
            </div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">상세 설명</label>
            <textarea 
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-red-500 focus:outline-none transition-colors h-24 resize-none"
              placeholder="구체적으로 적을수록 더 아프게 맞습니다."
              value={formData.productDesc}
              onChange={(e) => setFormData({...formData, productDesc: e.target.value})}
            />
          </Card>
        </section>

        {/* Action Button */}
        <div className="mb-16">
          <button 
            onClick={handleRun}
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-600 rounded-xl font-black text-xl text-white shadow-lg shadow-red-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                지옥불 계산 중...
              </>
            ) : (
              <>
                <Terminal className="w-6 h-6" />
                시뮬레이션 돌리기 (Enter Hell)
              </>
            )}
          </button>
        </div>

        {/* Result Section */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            
            {/* Top Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="생존 확률" value={`${result.simulation.survivalRate.toFixed(1)}%`} highlight />
              <StatBox label="Needs 점수" value={`${result.stats.consumer_needs}점`} />
              <StatBox label="최다 사망 구간" value={result.simulation.bottleneck} color="text-red-500" />
              <StatBox label="사망 원인" value={result.report.death_cause} textSm />
            </div>

            {/* 5 Stats Bars */}
            <Card title="📊 5대 스탯 분석">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(result.stats).map(([key, val]: any) => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${val}%` }} />
                    </div>
                    <div className="text-sm font-bold mt-1">{val}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Report & Debate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="🧪 부검 리포트">
                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{result.report.autopsy_report}</p>
                <div className="mt-4 p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                  <div className="text-xs text-red-400 font-bold mb-1 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> 최후의 발악 (Action Plan)</div>
                  <p className="text-sm text-gray-400">{result.report.action_plan}</p>
                </div>
              </Card>
              <Card title="☠️ 죽음의 깔때기 (Death Funnel)">
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={60} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]}>
                            {funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === result.simulation.bottleneck ? '#ef4444' : '#374151'} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <p className="text-center text-xs text-gray-500 mt-2">단계별 사망자 수 (높을수록 위험)</p>
              </Card>
            </div>

            {/* Debate Panel */}
            <Card title="💬 지옥의 독설 좌담회">
              <div className="bg-black/30 p-4 rounded-lg text-sm leading-7 text-gray-300 whitespace-pre-wrap border border-white/5">
                {result.debate}
              </div>
            </Card>

            {/* Failure Cases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="🔗 유사한 망한 사례">
                <ul className="space-y-3">
                  {result.pastCases.slice(0, 4).map((c: any, i: number) => (
                    <li key={i} className="group">
                      <a href={c.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:bg-white/5 p-2 rounded transition-colors">
                        <ExternalLink className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0 group-hover:text-blue-400" />
                        <div>
                          <div className="text-sm font-bold text-gray-300 group-hover:text-blue-400 underline-offset-2 group-hover:underline truncate">{c.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{c.content}</div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="📺 추천 영상 (Youtube)">
                <div className="space-y-2">
                    {result.report.youtube_queries.map((q: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                            <PlayCircle className="text-red-500 w-5 h-5" />
                            <span className="text-sm text-gray-300">{q}</span>
                        </div>
                    ))}
                    <p className="text-xs text-gray-500 mt-2">* 검색어를 유튜브에 입력해보세요.</p>
                </div>
              </Card>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

// UI Components
function Card({ title, children, className = "" }: any) {
  return (
    <div className={`bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 ${className}`}>
      <h3 className="font-bold text-gray-100 mb-4 flex items-center gap-2">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
      <input className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-red-500 focus:outline-none transition-colors" {...props} />
    </div>
  );
}

function Select({ label, options, ...props }: any) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
      <select className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-red-500 focus:outline-none transition-colors appearance-none" {...props}>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function StatBox({ label, value, highlight, color, textSm }: any) {
  return (
    <div className={`bg-[#0f0f0f] border border-white/10 rounded-xl p-4 text-center ${highlight ? "bg-red-900/10 border-red-500/30" : ""}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`font-black ${textSm ? "text-lg leading-tight" : "text-2xl md:text-3xl"} ${color || "text-white"}`}>{value}</div>
    </div>
  );
}
