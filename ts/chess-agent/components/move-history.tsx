import { ScrollArea } from "@/components/ui/scroll-area"

interface MoveHistoryProps {
  moves: string[]
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  if (moves.length === 0) {
    return <div className="text-gray-500 italic">No moves yet. Make your first move!</div>
  }

  return (
    <ScrollArea className="h-[calc(100%-40px)]">
      <div className="space-y-1">
        {moves.map((move, index) => {
          const isWhiteMove = move.startsWith("White")

          return (
            <div
              key={index}
              className={`p-2 rounded-md ${isWhiteMove ? "bg-blue-50 text-blue-800" : "bg-gray-100 text-gray-800"}`}
            >
              <span className="font-medium">{move}</span>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}