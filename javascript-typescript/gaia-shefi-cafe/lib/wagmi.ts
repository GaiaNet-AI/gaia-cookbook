import { http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { createConfig } from "wagmi"

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

