"use client";

import { DelegationManager } from "@/components/DelegationManager";
import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const ConnectButton = () => {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();

  const connector = connectors[0];

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect({ connector });
    }
  };

  return (
    <Button className="max-w-fit" onClick={handleConnect}>
      {isConnected ? "Disconnect" : "Connect Wallet"}
    </Button>
  );
};

export default function Home() {
  return (
    <div className="h-screen w-full overflow-y-auto grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="gap-8 row-start-2 sm:items-start h-full w-full">
        <div className="flex flex-col gap-3 items-center justify-center h-full">
          <ConnectButton />
          <DelegationManager />
        </div>
      </main>
    </div>
  );
}
