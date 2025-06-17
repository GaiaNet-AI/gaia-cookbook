import { http, createConfig } from "wagmi";
import { lineaSepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

export const config = createConfig({
  chains: [lineaSepolia],
  connectors: [
    metaMask()
  ],
  transports: {
    [lineaSepolia.id]: http(),
  },
  ssr: true
});