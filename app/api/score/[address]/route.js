import { NextResponse } from "next/server";
import { computeScore, scoreDemoWallet } from "../../../../lib/scorer";
import {
  getTransactionCount,
  getWalletAge,
  getStablecoinActivity,
  getMiniPayUsage,
  getContractInteractions,
} from "../../../../lib/celoClient";
import { getCrossChainReputation } from "../../../../lib/agentproof";

export async function GET(request, { params }) {
  const { address } = await params;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid Celo address" }, { status: 400 });
  }

  try {
    // Fetch all signals in parallel
    const [txCount, walletAgeDays, stablecoin, miniPay, contractData, crossChain] =
      await Promise.all([
        getTransactionCount(address),
        getWalletAge(address),
        getStablecoinActivity(address),
        getMiniPayUsage(address),
        getContractInteractions(address),
        getCrossChainReputation(address),
      ]);

    const result = computeScore({
      address,
      txCount,
      walletAgeDays,
      stablecoin,
      miniPay,
      crossChain,
      contractData,
      erc8004: null, // Sparse on Celo in v1
    });

    return NextResponse.json({ ...result, source: "live" });
  } catch (err) {
    console.error("CeloProof score error:", err);
    // Fallback to deterministic scoring
    try {
      const fallback = scoreDemoWallet(address);
      return NextResponse.json({ ...fallback, source: "deterministic" });
    } catch {
      return NextResponse.json(
        { error: "Scoring failed", detail: err.message },
        { status: 500 }
      );
    }
  }
}
