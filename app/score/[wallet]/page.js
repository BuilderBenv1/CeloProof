import { scoreDemoWallet } from "../../../lib/scorer";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const { wallet } = await params;
  const result = scoreDemoWallet(wallet);
  return {
    title: `CeloProof | ${result.tier.label} ${result.totalScore}/100`,
    description: `Wallet trust score for ${wallet.slice(0, 8)}...${wallet.slice(-4)} — ${result.tier.label} rated with ${result.totalScore}/100 on CeloProof`,
    openGraph: {
      title: `CeloProof | ${result.tier.label} ${result.totalScore}/100`,
      description: `Wallet trust score for ${wallet.slice(0, 8)}...${wallet.slice(-4)}`,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

function StaticRing({ score, tier, size = 140 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={tier.color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${tier.color}60)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.26, fontWeight: 800, color: tier.color, lineHeight: 1, fontFamily: "monospace" }}>{score}</span>
        <span style={{ fontSize: size * 0.11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginTop: 2, fontFamily: "monospace" }}>/100</span>
      </div>
    </div>
  );
}

export default async function ScorePage({ params }) {
  const { wallet } = await params;
  const result = scoreDemoWallet(wallet);
  const { totalScore, tier, signals, hardFloored, riskFlags } = result;
  const signalList = Object.values(signals);

  const shareText = encodeURIComponent(
    `My CeloProof trust score: ${tier.label} ${totalScore}/100\n\nCheck any Celo wallet:\nceloproof.vercel.app/score/${wallet}`
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080b0f", fontFamily: "'Space Mono', monospace", color: "rgba(255,255,255,0.85)", padding: 0, position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@600;800&display=swap'); * { box-sizing: border-box; } a { text-decoration: none; }`}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", padding: "40px 24px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg, #FCFF52 0%, #35D07F 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(53,208,127,0.3)" }}>
              <span style={{ fontSize: 16 }}>&#9672;</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "'Syne', sans-serif" }}>CeloProof</span>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: "8px 16px", borderRadius: 6, background: "rgba(29,155,240,0.15)", border: "1px solid rgba(29,155,240,0.3)", color: "#1d9bf0", fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>
              Share on X
            </a>
            <Link href="/leaderboard" style={{ padding: "8px 16px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Penalty warning */}
        {hardFloored && (
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.3)", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>&#9888;</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ff4444", fontFamily: "'Space Mono', monospace" }}>PENALTY REGISTRY — HARD FLOORED</span>
            </div>
          </div>
        )}

        {/* Score Card */}
        <div style={{ padding: 28, borderRadius: 14, border: `1px solid ${tier.color}25`, background: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, ${tier.bg} 100%)`, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <StaticRing score={totalScore} tier={tier} size={140} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 6, border: `1px solid ${tier.color}40`, background: tier.bg, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color, boxShadow: `0 0 6px ${tier.color}` }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: tier.color, letterSpacing: "0.12em", fontFamily: "'Space Mono', monospace" }}>{tier.label}</span>
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
                {wallet.slice(0, 8)}...{wallet.slice(-8)}
              </div>
              <a href={`https://explorer.celo.org/mainnet/address/${wallet}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#35D07F", fontFamily: "'Space Mono', monospace" }}>
                View on Celo Explorer →
              </a>
            </div>
          </div>
        </div>

        {/* Signal Breakdown */}
        <div style={{ padding: 24, borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 20 }}>Signal breakdown</div>
          {signalList.map((signal) => {
            const pct = (signal.score / signal.max) * 100;
            const barColor = pct >= 80 ? "#35D07F" : pct >= 55 ? "#7fff80" : pct >= 35 ? "#FCFF52" : "#ff6644";
            return (
              <div key={signal.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{signal.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono', monospace" }}>{signal.value}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor, fontFamily: "'Space Mono', monospace", minWidth: 32, textAlign: "right" }}>
                      {signal.score}<span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400 }}>/{signal.max}</span>
                    </span>
                  </div>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2, boxShadow: `0 0 8px ${barColor}50` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Risk Flags */}
        <div style={{ padding: 20, borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>Risk flags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {riskFlags && riskFlags.length > 0 ? riskFlags.map((f) => (
              <div key={f.flag} style={{ padding: "5px 10px", borderRadius: 5, background: f.severity === "critical" ? "rgba(255,68,68,0.1)" : "rgba(255,160,64,0.1)", border: `1px solid ${f.severity === "critical" ? "rgba(255,68,68,0.2)" : "rgba(255,160,64,0.2)"}`, fontSize: 11, color: f.severity === "critical" ? "#ff4444" : "#ffa040" }}>
                {f.flag}: {f.detail}
              </div>
            )) : (
              <div style={{ padding: "5px 10px", borderRadius: 5, background: "rgba(53,208,127,0.08)", border: "1px solid rgba(53,208,127,0.2)", fontSize: 11, color: "#35D07F" }}>
                No risk flags detected
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>CELOPROOF · TRUST ORACLE · CELO / MINIPAY</div>
          <Link href="/" style={{ fontSize: 11, color: "rgba(53,208,127,0.6)", fontFamily: "'Space Mono', monospace" }}>← celoproof.vercel.app</Link>
        </div>
      </div>
    </div>
  );
}
