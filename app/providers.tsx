"use client";

import * as React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    }),
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}