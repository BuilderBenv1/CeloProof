// AgentProof oracle API client — cross-chain reputation

const BASE_URL = process.env.AGENTPROOF_BASE_URL || "https://oracle.agentproof.sh";

export async function getCrossChainReputation(address) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/trust/${address}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getLeaderboard(chain = "celo", limit = 10) {
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/leaderboard?chain=${chain}&limit=${limit}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.leaderboard || data.agents || data || [];
  } catch {
    return [];
  }
}

export async function checkOracleHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/network/stats`, {
      signal: AbortSignal.timeout(5000),
    });
    return { reachable: res.ok, status: res.status };
  } catch {
    return { reachable: false, status: 0 };
  }
}
