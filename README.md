# CeloProof

Agent & wallet trust oracle for the Celo / MiniPay ecosystem. Scores wallets across 7 on-chain signals with a penalty registry hard-floor and category-aware anomaly detection.

## Architecture

```
Celo Wallet ──→ CeloProof ──→ Trust Score
                   │
                   ├── Celo Explorer API (tx history, stablecoin activity, MiniPay usage)
                   ├── AgentProof Oracle (cross-chain EVM + Solana reputation)
                   └── Penalty Registry (OFAC, known exploiters → hard floor)
```

## Scoring — 7 Signals, 100 Points

| Signal | Points | Source | Notes |
|---|---|---|---|
| Stablecoin Activity | 20 | cUSD/cEUR/cREAL transfers | Core Celo signal |
| Transaction Volume | 20 | Celo Explorer tx count | Raw activity |
| MiniPay Usage | 20 | MiniPay contract interactions | 14M user signal |
| Cross-chain Reputation | 15 | AgentProof oracle | EVM + Solana history |
| Wallet Age | 15 | First tx timestamp on Celo | Newness penalty |
| Contract Interactions | 5 | Verified contract calls vs EOA | Sophistication |
| ERC-8004 Registry | 5 | Celo agent registry if present | Agent-specific |

## Trust Tiers

| Tier | Score | Color |
|---|---|---|
| PLATINUM | 80-100 | Green |
| GOLD | 60-79 | Gold |
| SILVER | 40-59 | Silver |
| BRONZE | 20-39 | Bronze |
| HIGH RISK | 0-19 | Red |

## Penalty Registry

Known malicious addresses (OFAC SDN list, confirmed Celo exploiters, rug wallets) are **hard-floored** to HIGH RISK regardless of composite score. This runs after scoring and cannot be overridden by good signals elsewhere.

The seed list is small in v1. It grows as confirmed exploits are reported.

## Anomaly Detection

Category-aware — MiniPay is a payments wallet, so high transaction frequency is **normal**. CeloProof uses wider thresholds for wallets with >100 stablecoin transactions and only flags anomalies relative to the wallet's own historical baseline.

## API

```bash
# Score a wallet
curl https://celoproof.vercel.app/api/score/0xYOUR_ADDRESS

# Leaderboard
curl https://celoproof.vercel.app/api/leaderboard

# Health check
curl https://celoproof.vercel.app/api/health
```

### Example response

```json
{
  "address": "0x742d...2bD28",
  "totalScore": 67,
  "tier": { "label": "GOLD", "color": "#FFD700" },
  "hardFloored": false,
  "signals": {
    "stablecoinActivity": { "score": 14, "max": 20, "value": "85 txs (cUSD)", "source": "Celo Explorer" },
    "transactionVolume": { "score": 14, "max": 20, "value": "312 transactions", "source": "Celo Explorer" },
    "miniPayUsage": { "score": 12, "max": 20, "value": "23 interactions", "source": "Celo Explorer" },
    "crossChainReputation": { "score": 9, "max": 15, "value": "55/100 (Silver)", "source": "AgentProof Oracle" },
    "walletAge": { "score": 12, "max": 15, "value": "1y 3m", "source": "Celo Explorer" },
    "contractInteractions": { "score": 3, "max": 5, "value": "45/312 (14%)", "source": "Celo Explorer" },
    "erc8004Registry": { "score": 0, "max": 5, "value": "Not registered", "source": "On-chain" }
  },
  "anomalyDetected": false,
  "riskFlags": [],
  "celoExplorerUrl": "https://explorer.celo.org/mainnet/address/0x742d..."
}
```

## Quick Start

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Deploy

Deploy to Vercel — connect the GitHub repo and it auto-deploys.

## Known Limitations (v1)

- **ERC-8004 registry data is sparse on Celo** — most wallets score 0/5 on this signal. This is accurate, not a bug.
- **No community review system** — planned for v2. Scores are purely on-chain in v1.
- **Penalty registry seed list is small** — grows as confirmed exploits are reported and verified.
- **MiniPay detection** relies on known contract addresses. New MiniPay contract versions may need manual addition.
- **Cross-chain reputation** defaults to neutral (7/15) when AgentProof has no data. This prevents penalizing Celo-only wallets.

## Deployed Contract

- **Contract:** [`0x0be969d494f387a631cc3f6371c5e25502dee4e6`](https://explorer.celo.org/mainnet/address/0x0be969d494f387a631cc3f6371c5e25502dee4e6)
- **Tx:** [`0xc149fc34...`](https://explorer.celo.org/mainnet/tx/0xc149fc3401bc124b0c3249b5863390f6e1e1b7a8b527205ee9a1234c1704dcb3)
- **Chain:** Celo Mainnet (42220)
- **Type:** Trust Attestation Registry

## MiniPay Compatibility

CeloProof detects MiniPay's injected wallet (`window.ethereum.isMiniPay`) and auto-connects. Inside MiniPay:
- Wallet connects automatically — no connect button shown
- Wallet address is auto-scored on load
- Uses `viem` (not ethers.js) per MiniPay requirements
- Legacy transaction type for compatibility

## Links

- [Celo](https://celo.org)
- [MiniPay](https://www.opera.com/products/minipay)
- [AgentProof Oracle](https://oracle.agentproof.sh)
- [Celo Explorer](https://explorer.celo.org)

## License

MIT
