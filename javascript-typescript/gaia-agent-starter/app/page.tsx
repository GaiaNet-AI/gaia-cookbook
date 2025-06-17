"use client";

import { Chat } from "@/components/Chat";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div 
      className="h-screen w-full overflow-y-auto grid grid-rows-[20px_1fr_60px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]"
      style={{ 
        background: "linear-gradient(135deg, #fcf8e8 0%, #d4e2d4 100%)",
      }}
    >
      <main className="gap-8 row-start-2 sm:items-start h-full w-full">
        <div className="flex flex-col gap-3 items-center justify-center h-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 text-green-800" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.1)" }}>
              Hi there, Let's Chat 👋
            </h1>
            <p className="text-sm text-green-600 italic">
              powered by <Link href="https://www.gaianet.ai/" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-900 underline">gaia</Link> 🌱
            </p>
          </div>
          <Chat />
        </div>
      </main>
      
      <footer className="row-start-3 w-full text-center text-green-700 border-t border-green-200 pt-4">
        <p>
          <Link href="https://docs.gaianet.ai/intro" target="_blank" rel="noopener noreferrer" className="hover:text-green-900 underline">
            Visit Gaia Docs
          </Link> to learn more about this decentralized AI network
        </p>
      </footer>
    </div>
  );
}
