import { NextResponse } from "next/server";
import { checkOracleHealth } from "../../../lib/agentproof";

export async function GET() {
  const oracle = await checkOracleHealth();

  // Quick Celo RPC check
  let celoRpc = { reachable: false };
  try {
    const res = await fetch(process.env.CELO_RPC_URL || "https://forno.celo.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    celoRpc = { reachable: res.ok };
  } catch {}

  return NextResponse.json({
    status: "ok",
    service: "celoproof",
    version: "1.0.0",
    oracle,
    celoRpc,
  });
}
