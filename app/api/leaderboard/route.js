import { NextResponse } from "next/server";
import { generateLeaderboard } from "../../../lib/scorer";
import { getLeaderboard } from "../../../lib/agentproof";

export async function GET() {
  try {
    // Try live leaderboard from AgentProof oracle
    const live = await getLeaderboard("celo", 10);
    if (Array.isArray(live) && live.length > 0) {
      return NextResponse.json({ source: "live", leaderboard: live });
    }
  } catch {
    // Fall through to deterministic
  }

  const leaderboard = generateLeaderboard(10);
  return NextResponse.json({ source: "deterministic", leaderboard });
}
