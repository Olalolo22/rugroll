import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProviders } from "@/components/WalletProviders";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RugRoll — Provably Fair Crash Game on Solana",
  description:
    "A 10ms real-time crash game powered by MagicBlock Ephemeral Rollups and VRF. Bail out before the rug pulls or lose it all.",
  keywords: ["solana", "crash game", "magicblock", "ephemeral rollups", "VRF", "defi", "gaming"],
  openGraph: {
    title: "RugRoll",
    description: "Provably fair crash game. 10ms blocks. No mercy.",
    type: "website",
  },
};

// Prevents the virtual keyboard from resizing the layout on mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <WalletProviders>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1a2e",
                color: "#e2e8f0",
                border: "1px solid rgba(139, 92, 246, 0.3)",
              },
            }}
          />
        </WalletProviders>
      </body>
    </html>
  );
}
