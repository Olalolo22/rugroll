"use client";

import dynamic from "next/dynamic";
import React from "react";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function WalletButton({ className }: { className?: string }) {
  return <WalletMultiButtonDynamic className={className} />;
}
