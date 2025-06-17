import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatPanelProps {
  messages: {
    sender: string
    message: string
  }[]
}

export default function ChatPanel({ messages }: ChatPanelProps) {
  if (messages.length === 0) {
    return <div className="text-gray-500 italic">No messages yet.</div>
  }

  return (
    <ScrollArea className="h-[calc(100%-40px)]">
      <div className="space-y-3">
        {messages.map((msg, index) => {
          const isAI = msg.sender === "AI"

          return (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                isAI ? "bg-gray-100 text-gray-800 rounded-tl-sm" : "bg-blue-50 text-blue-800 ml-4 rounded-tr-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${isAI ? "text-gray-600" : "text-blue-600"}`}>{msg.sender}</span>
              </div>
              <p className="text-sm">{msg.message}</p>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}