"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ModelSelector } from "@/components/model-selector"
import { ModelSettingsDialog } from "@/components/model-setting-dialog"
import { ChatMessage, ThinkingMessage } from "@/components/chat-message"
import { Send } from "lucide-react"

interface Chat {
  id: string
  title: string
  createdAt: Date
  messages: any[]
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("metamask")
  const [isThinking, setIsThinking] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [models, setModels] = useState<any[]>([])

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    body: {
      modelId: selectedModel,
    },
    onFinish: (message) => {
      setIsThinking(false)
      if (currentChatId) {
        updateChatMessages(currentChatId, [...messages, message])
      }
    },
    onResponse: () => {
      setIsThinking(false)
    },
    onError: (error) => {
      console.error("Chat error:", error)
      setIsThinking(false)
    },
  })

  useEffect(() => {
    const savedChats = localStorage.getItem("chats")
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
      }))
      setChats(parsedChats)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then(setModels)
      .catch(console.error)
  }, [])

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      createdAt: new Date(),
      messages: [],
    }
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    setMessages([])
  }

  const selectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
    }
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
    }
  }

  const updateChatMessages = (chatId: string, newMessages: any[]) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: newMessages,
              title:
                newMessages.length > 0 && newMessages[0].content
                  ? newMessages[0].content.slice(0, 50) + (newMessages[0].content.length > 50 ? "..." : "")
                  : "New Chat",
            }
          : chat,
      ),
    )
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    if (!currentChatId) {
      createNewChat()
    }

    setIsThinking(true)
    handleSubmit(e)
  }

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={createNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">AI Chat</h1>
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {messages.length === 0 && !isThinking ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">How can I help you today?</h2>
                <p className="text-gray-500">Start a conversation with AI using the selected model</p>
              </div>
            </div>
          ) : (
            <div className="pb-32">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isThinking && (
                <ThinkingMessage modelName={models.find((m) => m.id === selectedModel)?.name || selectedModel} />
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gray-200 p-4">
          <form onSubmit={onSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={isThinking ? "AI is thinking..." : "Type your message..."}
              className="flex-1"
              disabled={isThinking}
            />
            <Button type="submit" disabled={!input.trim() || isThinking}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <ModelSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
