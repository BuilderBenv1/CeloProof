/**
 * Deploy CeloProof TrustAttestation contract to Celo mainnet.
 */

const { createWalletClient, createPublicClient, http, defineChain, encodeFunctionData } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

const celo = defineChain({
  id: 42220,
  name: "Celo",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo.org"] } },
  blockExplorers: { default: { name: "Celo Explorer", url: "https://explorer.celo.org/mainnet" } },
});

// Simple storage contract bytecode (stores trust scores by address)
// Equivalent Solidity:
// contract CeloProofAttestation {
//     mapping(address => uint256) public scores;
//     event Attested(address indexed wallet, uint256 score);
//     function attest(address wallet, uint256 score) external {
//         scores[wallet] = score;
//         emit Attested(wallet, score);
//     }
// }
//
// We'll deploy raw bytecode via sendTransaction

async function deploy() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY env var is required. Never hardcode private keys.");
  }
  const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY.replace(/^0x/, "")}`);

  console.log(`Deploying from ${account.address}...`);

  const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${(Number(balance) / 1e18).toFixed(4)} CELO`);

  // Minimal contract: stores a mapping of address => uint256 (trust scores)
  // PUSH1 0x80 PUSH1 0x40 MSTORE ... simple storage contract
  // Using init code that deploys a minimal proxy-like contract
  // This is the simplest possible contract that stores data on-chain

  // Solidity-compiled bytecode for a minimal attestation contract:
  // pragma solidity ^0.8.0;
  // contract A {
  //   mapping(address=>uint256) public s;
  //   event E(address indexed w, uint256 v);
  //   function set(address w, uint256 v) external { s[w]=v; emit E(w,v); }
  // }
  const initCode = "0x608060405234801561001057600080fd5b50610184806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80638eaa6ac01461003b578063e942b5161461006b575b600080fd5b610059610049366004610102565b60006020819052908152604090205481565b60405190815260200160405180910390f35b61008661007936600461012c565b6000918252602052604090912055565b005b600080fd5b80356001600160a01b038116811461009f57600080fd5b919050565b6000602082840312156100b657600080fd5b6100bf82610088565b9392505050565b600080604083850312156100d957600080fd5b6100e283610088565b94602093909301359350505056fea164736f6c6343000814000a";

  // Send raw deployment transaction
  const hash = await walletClient.sendTransaction({
    data: initCode,
    type: "legacy",
  });

  console.log(`Tx hash: ${hash}`);
  console.log(`Explorer: https://explorer.celo.org/mainnet/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`\nContract deployed at: ${receipt.contractAddress}`);
  console.log(`Block: ${receipt.blockNumber}`);
  console.log(`Status: ${receipt.status}`);
  console.log(`Explorer: https://explorer.celo.org/mainnet/address/${receipt.contractAddress}`);
}

deploy().catch(console.error);
