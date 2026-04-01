// CeloProof trust tiers

export function getTierInfo(totalScore) {
  if (totalScore >= 80)
    return { label: "PLATINUM", color: "#00ff88", bg: "rgba(0,255,136,0.08)" };
  if (totalScore >= 60)
    return { label: "GOLD", color: "#FFD700", bg: "rgba(255,215,0,0.08)" };
  if (totalScore >= 40)
    return { label: "SILVER", color: "#C0C0C0", bg: "rgba(192,192,192,0.08)" };
  if (totalScore >= 20)
    return { label: "BRONZE", color: "#CD7F32", bg: "rgba(205,127,50,0.08)" };
  return { label: "HIGH RISK", color: "#ff4444", bg: "rgba(255,68,68,0.08)" };
}
