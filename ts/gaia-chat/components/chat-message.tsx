"use client"

import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"

interface ThinkingMessageProps {
  modelName?: string
}

function ThinkingMessage({ modelName }: ThinkingMessageProps) {
  return (
    <div className="flex w-full py-4 px-4 bg-gray-50">
      <div className="flex w-full max-w-4xl mx-auto">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 px-4 ml-4 space-y-2 overflow-hidden">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <span className="text-sm text-gray-600">{modelName} is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ThinkingMessage }

interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full py-4 px-4", isUser ? "bg-transparent" : "bg-gray-50")}>
      <div className="flex w-full max-w-4xl mx-auto">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
            isUser ? "bg-background" : "bg-primary text-primary-foreground",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        <div className="flex-1 px-4 ml-4 space-y-2 overflow-hidden">
          <div className="prose prose-sm max-w-none break-words">{message.content}</div>
        </div>
      </div>
    </div>
  )
}
