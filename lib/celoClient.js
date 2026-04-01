// Celo RPC + Explorer API client

const CELO_RPC = process.env.CELO_RPC_URL || "https://forno.celo.org";
const CELO_EXPLORER = process.env.CELO_EXPLORER_API || "https://explorer.celo.org/mainnet/api";

// Known Celo stablecoin contracts
const STABLECOINS = {
  "0x765de816845861e75a25fca122bb6898b8b1282a": "cUSD",
  "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73": "cEUR",
  "0xe8537a3d056da446677b9e9d6c5db704eaab4787": "cREAL",
};

// Known MiniPay-related contracts (MiniPay wallet factory, common interaction targets)
const MINIPAY_CONTRACTS = [
  "0x2f25deb3848c207fc8e0c34035b3ba7fc157602b", // MiniPay entrypoint
  "0x765de816845861e75a25fca122bb6898b8b1282a", // cUSD (primary MiniPay currency)
].map((a) => a.toLowerCase());

async function celoExplorerGet(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${CELO_EXPLORER}?${qs}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Celo Explorer ${res.status}`);
  return res.json();
}

export async function getTransactionCount(address) {
  try {
    const data = await celoExplorerGet({
      module: "account",
      action: "txlist",
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 1,
      sort: "desc",
    });
    // Explorer returns total count in the result header or we count
    // Use a separate call for count
    const countData = await celoExplorerGet({
      module: "account",
      action: "txlist",
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 10000,
      sort: "asc",
    });
    const txs = countData.result || [];
    return Array.isArray(txs) ? txs.length : 0;
  } catch (err) {
    console.error("getTransactionCount:", err.message);
    return 0;
  }
}

export async function getWalletAge(address) {
  try {
    const data = await celoExplorerGet({
      module: "account",
      action: "txlist",
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 1,
      sort: "asc",
    });
    const txs = data.result;
    if (!Array.isArray(txs) || txs.length === 0) return 0;
    const firstTx = parseInt(txs[0].timeStamp, 10);
    return Math.max(0, Math.floor((Date.now() / 1000 - firstTx) / 86400));
  } catch (err) {
    console.error("getWalletAge:", err.message);
    return 0;
  }
}

export async function getStablecoinActivity(address) {
  try {
    const data = await celoExplorerGet({
      module: "account",
      action: "tokentx",
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 10000,
      sort: "desc",
    });
    const txs = data.result || [];
    if (!Array.isArray(txs)) return { count: 0, tokens: [] };

    const stableTxs = txs.filter(
      (tx) => STABLECOINS[tx.contractAddress?.toLowerCase()]
    );
    const tokens = [...new Set(stableTxs.map((tx) => STABLECOINS[tx.contractAddress.toLowerCase()]))];
    return { count: stableTxs.length, tokens };
  } catch (err) {
    console.error("getStablecoinActivity:", err.message);
    return { count: 0, tokens: [] };
  }
}

export async function getMiniPayUsage(address) {
  try {
    const data = await celoExplorerGet({
      module: "account",
      action: "txlist",
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 10000,
      sort: "desc",
    });
    const txs = data.result || [];
    if (!Array.isArray(txs)) return { interactions: 0, detected: false };

    const miniPayTxs = txs.filter(
      (tx) => MINIPAY_CONTRACTS.includes(tx.to?.toLowerCase()) || MINIPAY_CONTRACTS.includes(tx.from?.toLowerCase())
    );
    return { interactions: miniPayTxs.length, detected: miniPayTxs.length > 0 };
  } catch (err) {
    console.error("getMiniPayUsage:", err.message);
    return { interactions: 0, detected: false };
  }
}

export async function getContractInteractions(address) {
  try {
    const data = await celoExplorerGet({
      module: "account",
      action: "txlist",
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 10000,
      sort: "desc",
    });
    const txs = data.result || [];
    if (!Array.isArray(txs)) return { contractCalls: 0, totalTxs: 0 };

    // Transactions with input data != "0x" are contract calls
    const contractCalls = txs.filter((tx) => tx.input && tx.input !== "0x" && tx.input.length > 2).length;
    return { contractCalls, totalTxs: txs.length };
  } catch (err) {
    console.error("getContractInteractions:", err.message);
    return { contractCalls: 0, totalTxs: 0 };
  }
}
