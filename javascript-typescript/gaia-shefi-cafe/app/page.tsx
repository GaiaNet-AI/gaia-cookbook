"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Flower2, Send, Sprout, Leaf, FlowerIcon as Garden } from "lucide-react"
import { useAccount, useConnect, useDisconnect } from "wagmi"

const ConnectButton = () => {
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { isConnected } = useAccount()

  const connector = connectors[0]

  const handleConnect = () => {
    if (isConnected) {
      disconnect()
    } else {
      connect({ connector })
    }
  }

  return (
    <Button
      variant="outline"
      className={`
        ${isConnected ? "bg-emerald-100" : "bg-sage-50"} 
        border-2 border-emerald-300
        hover:border-emerald-400
        text-emerald-800
        px-6 py-6 
        rounded-2xl
        font-serif
        text-lg
        shadow-inner
        hover:shadow-lg
        transition-all
        duration-300
        group
      `}
      onClick={handleConnect}
    >
      <Sprout
        className={`mr-2 h-5 w-5 transition-transform group-hover:rotate-12 ${isConnected ? "text-emerald-600" : "text-emerald-400"}`}
      />
      {isConnected ? "Disconnect from Garden 🌸" : "Connect to Garden"}
    </Button>
  )
}

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen  bg-cover bg-center">
      <div className="min-h-screen backdrop-blur-sm bg-gradient-to-b from-green-50/90 via-emerald-50/80 to-sage-50/90">
        <div className="container mx-auto px-4 py-8 h-screen grid grid-rows-[auto_1fr_auto] gap-8">
          {/* Decorative elements */}
          <div className="fixed top-0 left-0 w-full h-20 bg-[url('/placeholder.svg?height=100&width=400')] bg-repeat-x opacity-30 animate-float" />

          {/* Header */}
          <header className="text-center relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce-slow">🌿</div>
            <h1 className="text-5xl font-serif text-emerald-800 mb-4 relative inline-block">
              Shefi Cafe
              <span className="text-2xl text-emerald-600 ml-2">by gaia🌱</span>
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-emerald-200 rounded-full" />
            </h1>
          </header>

          {/* Main content */}
          <main className="flex flex-col items-center justify-center gap-8">
            <ConnectButton />

            {isConnected && (
              <Card className="w-full max-w-4xl bg-white/80 backdrop-blur-md border-2 border-emerald-100 shadow-lg rounded-3xl">
                <CardHeader className="border-b border-emerald-100">
                  <CardTitle className="flex items-center gap-2 font-serif text-emerald-800">
                    <Flower2 className="h-5 w-5 text-emerald-500 animate-spin-slow" />
                    <span>Magical Garden Assistant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[50vh] overflow-y-auto space-y-4 p-6 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2.5 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      } animate-grow-in`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                          <Leaf className="h-4 w-4 text-emerald-600" />
                        </div>
                      )}
                      <div
                        className={`
                          px-4 py-2 rounded-2xl max-w-[80%] 
                          ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-emerald-100 to-sage-200 border border-emerald-200"
                              : "bg-white/90 border border-emerald-100"
                          }
                          font-medium text-emerald-800
                          shadow-sm hover:shadow-md transition-shadow duration-200
                        `}
                      >
                        {/* Hide JSON output and only show the actual message content */}
                        {message.role === "assistant" && message.content.includes('{"name"')
                          ? message.content.substring(message.content.indexOf("}") + 2)
                          : message.content}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center border border-emerald-200">
                          <Garden className="h-4 w-4 text-emerald-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-2.5 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                        <Leaf className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-white/90 border border-emerald-100 font-medium text-emerald-800">
                        ai is thinking ... 🌸
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-emerald-100 p-4">
                  <form onSubmit={handleSubmit} className="flex w-full gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Plant your message in the garden..."
                      className="flex-1 bg-white/50 border-emerald-200 text-emerald-800 placeholder:text-emerald-400 rounded-xl"
                    />
                    <Button
                      type="submit"
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-xl"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            )}
          </main>

          {/* Footer */}
          <footer className="text-center text-emerald-600 font-serif">
            © 2025 Shefi Cafe - Nurturing Web3 Growth 🌱
          </footer>
        </div>
      </div>
    </div>
  )
}

