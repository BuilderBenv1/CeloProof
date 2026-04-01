// CeloProof composite scorer — 7 signals, 100 points total.
// Includes penalty registry hard-floor and category-aware anomaly detection.

import { getTierInfo } from "./tiers";
import { detectAnomalies } from "./anomaly";

// ─── PENALTY REGISTRY ────────────────────────────────────────────────────────
// Known malicious addresses hard-floored to HIGH RISK regardless of score.
// Seed list — grows as confirmed exploits are reported.
const PENALTY_REGISTRY = [
  // OFAC SDN list addresses (Tornado Cash deployer, etc.)
  "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
  "0x7f367cc41522ce07553e823bf3be79a889debe1b",
  // Known Celo exploiters — add as confirmed
].map((a) => a.toLowerCase());

// ─── SCORING FUNCTIONS ───────────────────────────────────────────────────────

function scoreStablecoinActivity(stablecoin) {
  // 20 points max
  const count = stablecoin.count || 0;
  if (count >= 500) return 20;
  if (count >= 200) return 17;
  if (count >= 50) return 14;
  if (count >= 10) return 10;
  if (count > 0) return 5;
  return 0; // Zero not penalty — absent signal scores 0, no deduction
}

function scoreTransactionVolume(txCount) {
  // 20 points max
  if (txCount >= 1000) return 20;
  if (txCount >= 500) return 17;
  if (txCount >= 100) return 14;
  if (txCount >= 20) return 10;
  if (txCount > 0) return 5;
  return 0;
}

function scoreMiniPayUsage(miniPay) {
  // 20 points max
  const interactions = miniPay.interactions || 0;
  if (!miniPay.detected) return 0; // Zero not penalty
  if (interactions >= 200) return 20;
  if (interactions >= 50) return 16;
  if (interactions >= 10) return 12;
  if (interactions > 0) return 8;
  return 0;
}

function scoreCrossChainReputation(agentproofData) {
  // 15 points max — default 7.5 (neutral) if no data
  if (!agentproofData) return 7; // Neutral, not zero
  const composite = agentproofData.composite_score ?? agentproofData.score ?? 0;
  if (composite >= 80) return 15;
  if (composite >= 60) return 12;
  if (composite >= 40) return 9;
  if (composite >= 20) return 6;
  return 3;
}

function scoreWalletAge(days) {
  // 15 points max
  if (days >= 730) return 15;
  if (days >= 365) return 12;
  if (days >= 180) return 9;
  if (days >= 60) return 6;
  if (days >= 14) return 3;
  if (days > 0) return 1;
  return 0;
}

function scoreContractInteractions(contractData) {
  // 5 points max
  const ratio = contractData.totalTxs > 0
    ? contractData.contractCalls / contractData.totalTxs
    : 0;
  if (ratio >= 0.5 && contractData.contractCalls >= 20) return 5;
  if (ratio >= 0.3 && contractData.contractCalls >= 10) return 4;
  if (contractData.contractCalls >= 5) return 3;
  if (contractData.contractCalls > 0) return 1;
  return 0; // Zero not penalty
}

function scoreErc8004Registry(registryData) {
  // 5 points max — absent signal scores 0, no penalty
  if (!registryData || !registryData.registered) return 0;
  return 5;
}

// ─── COMPOSITE SCORER ────────────────────────────────────────────────────────

export function computeScore({
  address,
  txCount,
  walletAgeDays,
  stablecoin,
  miniPay,
  crossChain,
  contractData,
  erc8004,
}) {
  const signals = {
    stablecoinActivity: {
      label: "Stablecoin Activity",
      score: scoreStablecoinActivity(stablecoin),
      max: 20,
      value: stablecoin.count > 0
        ? `${stablecoin.count} txs (${stablecoin.tokens?.join(", ") || "cUSD"})`
        : "No stablecoin txs",
      detail: "cUSD/cEUR/cREAL transfer count",
      source: "Celo Explorer",
    },
    transactionVolume: {
      label: "Transaction Volume",
      score: scoreTransactionVolume(txCount),
      max: 20,
      value: `${txCount} transactions`,
      detail: "Total on-chain transaction count",
      source: "Celo Explorer",
    },
    miniPayUsage: {
      label: "MiniPay Usage",
      score: scoreMiniPayUsage(miniPay),
      max: 20,
      value: miniPay.detected
        ? `${miniPay.interactions} interactions`
        : "Not detected",
      detail: "MiniPay contract interactions",
      source: "Celo Explorer",
    },
    crossChainReputation: {
      label: "Cross-chain Reputation",
      score: scoreCrossChainReputation(crossChain),
      max: 15,
      value: crossChain
        ? `${crossChain.composite_score ?? crossChain.score ?? 0}/100 (${crossChain.trust_tier || "Unknown"})`
        : "No cross-chain data (neutral)",
      detail: "AgentProof EVM + Solana reputation",
      source: "AgentProof Oracle",
    },
    walletAge: {
      label: "Wallet Age",
      score: scoreWalletAge(walletAgeDays),
      max: 15,
      value:
        walletAgeDays >= 365
          ? `${Math.floor(walletAgeDays / 365)}y ${Math.floor((walletAgeDays % 365) / 30)}m`
          : walletAgeDays > 0
            ? `${Math.floor(walletAgeDays / 30)}m ${walletAgeDays % 30}d`
            : "Unknown",
      detail: "First transaction timestamp on Celo",
      source: "Celo Explorer",
    },
    contractInteractions: {
      label: "Contract Interactions",
      score: scoreContractInteractions(contractData),
      max: 5,
      value: contractData.totalTxs > 0
        ? `${contractData.contractCalls}/${contractData.totalTxs} (${Math.round((contractData.contractCalls / contractData.totalTxs) * 100)}%)`
        : "No data",
      detail: "Verified contract calls vs EOA transfers",
      source: "Celo Explorer",
    },
    erc8004Registry: {
      label: "ERC-8004 Registry",
      score: scoreErc8004Registry(erc8004),
      max: 5,
      value: erc8004?.registered ? `Agent #${erc8004.agentId}` : "Not registered",
      detail: "Celo ERC-8004 agent registry status",
      source: "On-chain",
    },
  };

  let totalScore = Object.values(signals).reduce((a, s) => a + s.score, 0);
  let tier = getTierInfo(totalScore);
  let hardFloored = false;

  // Anomaly detection
  const anomaly = detectAnomalies({
    txCount,
    stablecoinTxCount: stablecoin.count || 0,
    walletAgeDays,
  });

  // Penalty registry — runs LAST, overrides everything
  if (PENALTY_REGISTRY.includes(address.toLowerCase())) {
    totalScore = 5;
    tier = getTierInfo(5);
    hardFloored = true;
    anomaly.riskFlags.push({
      flag: "PENALTY_REGISTRY",
      detail: "Address is on the penalty registry — hard-floored to HIGH RISK",
      severity: "critical",
    });
  }

  return {
    address,
    totalScore,
    tier,
    hardFloored,
    signals,
    ...anomaly,
    celoExplorerUrl: `https://explorer.celo.org/mainnet/address/${address}`,
    scoredAt: new Date().toISOString(),
  };
}

// ─── DEMO / DETERMINISTIC SCORING ────────────────────────────────────────────

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function generateDemoProfile(address) {
  const seed = hashCode(address);
  const rand = (min, max, offset = 0) => min + ((seed + offset) % (max - min + 1));
  return {
    address,
    txCount: rand(5, 2000, 1),
    walletAgeDays: rand(1, 900, 2),
    stablecoin: {
      count: rand(0, 600, 3),
      tokens: rand(0, 2, 4) > 0 ? ["cUSD"] : [],
    },
    miniPay: {
      interactions: rand(0, 300, 5),
      detected: rand(0, 1, 6) === 1,
    },
    crossChain: rand(0, 1, 7) === 1 ? { composite_score: rand(10, 90, 8), trust_tier: "Silver" } : null,
    contractData: {
      contractCalls: rand(0, 200, 9),
      totalTxs: rand(10, 2000, 10),
    },
    erc8004: rand(0, 3, 11) === 0 ? { registered: true, agentId: rand(1, 500, 12).toString() } : null,
  };
}

export function scoreDemoWallet(address) {
  const profile = generateDemoProfile(address);
  return computeScore(profile);
}

export const DEMO_WALLETS = [
  { label: "0x742d...2bD2", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28", name: "MiniPay Power User" },
  { label: "0xAb8c...f901", address: "0xAb8c3F1d2E6B7890cDe4567FAb12345678f90123", name: "cUSD Merchant" },
  { label: "0x1234...aBcD", address: "0x1234567890aBcDeF1234567890aBcDeF12345678", name: "DeFi Explorer" },
  { label: "0xdEaD...bEeF", address: "0xdEaDbEeF00000000000000000000000000bEeF01", name: "New Wallet" },
];

export function generateLeaderboard(count = 10) {
  const HEX = "0123456789abcdef";
  const entries = [];
  for (let i = 0; i < count * 3; i++) {
    const seed = hashCode(`celo-leaderboard-${i}`);
    let address = "0x";
    for (let j = 0; j < 40; j++) {
      address += HEX[(seed * (j + 1) + j * 7 + i * 13) % HEX.length];
    }
    const result = scoreDemoWallet(address);
    entries.push(result);
  }
  entries.sort((a, b) => b.totalScore - a.totalScore);
  return entries.slice(0, count).map((e, i) => ({ rank: i + 1, ...e }));
}
