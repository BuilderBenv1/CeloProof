// Category-aware anomaly detection for Celo / MiniPay wallets.
// MiniPay is a payments wallet — high tx frequency is NORMAL.
// Only flag anomalies relative to the wallet's own baseline.

export function detectAnomalies(profile) {
  const flags = [];

  // Wide threshold for payment-heavy wallets
  const volatilityThreshold = profile.txCount > 100 ? 35 : 20;

  // Stablecoin velocity anomaly — sudden spike relative to wallet history
  if (profile.stablecoinTxCount > 0 && profile.walletAgeDays > 0) {
    const dailyRate = profile.stablecoinTxCount / Math.max(profile.walletAgeDays, 1);
    // Only flag if >50 stablecoin tx/day AND wallet is under 14 days old
    if (dailyRate > volatilityThreshold && profile.walletAgeDays < 14) {
      flags.push({
        flag: "SUSPICIOUS_VELOCITY",
        detail: `${Math.round(dailyRate)} stablecoin tx/day on a ${profile.walletAgeDays}d wallet`,
        severity: "warning",
      });
    }
  }

  // New wallet with unusually high value
  if (profile.walletAgeDays < 7 && profile.txCount > 200) {
    flags.push({
      flag: "NEW_HIGH_ACTIVITY",
      detail: `${profile.txCount} txs in ${profile.walletAgeDays} days`,
      severity: "info",
    });
  }

  // Zero stablecoin usage on what should be a payments wallet
  if (profile.txCount > 50 && profile.stablecoinTxCount === 0) {
    flags.push({
      flag: "NO_STABLECOIN_USAGE",
      detail: "Active wallet with zero stablecoin transactions",
      severity: "info",
    });
  }

  return {
    anomalyDetected: flags.some((f) => f.severity === "warning"),
    riskFlags: flags,
  };
}
