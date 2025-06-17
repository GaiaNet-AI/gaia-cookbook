"use client";

import { WagmiProvider } from "wagmi";
import { config } from "@/wagmi.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { lineaSepolia } from "viem/chains";

export const client = createPublicClient({
  chain: lineaSepolia,
  transport: http(),
});

interface WagmiProviderProps {
  children: React.ReactNode;
}

const Provider: React.FC<WagmiProviderProps> = ({ children }) => {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

export default Provider;