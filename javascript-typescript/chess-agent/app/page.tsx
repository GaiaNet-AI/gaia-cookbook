import ChessGame from "@/components/chess-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center">Chess vs AI</h1>
      <ChessGame />
    </main>
  )
}