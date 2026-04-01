import "./globals.css";

export const metadata = {
  title: "CeloProof — Agent & Wallet Trust Oracle for Celo / MiniPay",
  description:
    "Paste any wallet address and get a composite 0-100 trust score across 7 on-chain signals. Built for the Celo and MiniPay ecosystem.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://celoproof.vercel.app"),
  openGraph: {
    title: "CeloProof — Wallet Trust Scores",
    description:
      "On-chain trust oracle for Celo wallets. 7 signals. Penalty registry. Category-aware anomaly detection.",
    siteName: "CeloProof",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CeloProof",
    description: "Trust oracle for Celo / MiniPay wallets",
  },
  icons: {
    icon: "/favicon.svg",
  },
  themeColor: "#080b0f",
};

export const viewport = {
  themeColor: "#080b0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
