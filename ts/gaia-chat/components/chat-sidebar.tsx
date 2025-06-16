"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Settings, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Chat {
  id: string
  title: string
  createdAt: Date
}

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onOpenSettings: () => void
}

export function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenSettings,
}: ChatSidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 border-r border-gray-700">
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group relative flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors",
                currentChatId === chat.id && "bg-gray-800",
              )}
              onMouseEnter={() => setHoveredChat(chat.id)}
              onMouseLeave={() => setHoveredChat(null)}
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{chat.title}</span>
              {hoveredChat === chat.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-700">
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <Settings className="w-4 h-4 mr-2" />
          Model Settings
        </Button>
      </div>
    </div>
  )
}
