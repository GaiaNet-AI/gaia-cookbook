"use client"
import { Card } from "@/components/ui/card"

interface ColorSelectorProps {
  onSelectColor: (color: "white" | "black") => void
}

export default function ColorSelector({ onSelectColor }: ColorSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-xl font-semibold mb-6">Choose Your Color</h2>
      <p className="text-center mb-4 text-gray-600">Select which color pieces you want to play with</p>

      <div className="flex gap-4">
        <Card
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-blue-300"
          onClick={() => onSelectColor("white")}
        >
          <div className="w-20 h-20 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-2">
            <svg width="40" height="40" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.5 9C25.15 9 27.5 11.35 27.5 14C27.5 15.5 26.7 16.9 25.5 17.75C29.35 18.95 32 22.55 32 26.75V29.5H13V26.75C13 22.55 15.65 18.95 19.5 17.75C18.3 16.9 17.5 15.5 17.5 14C17.5 11.35 19.85 9 22.5 9Z"
                fill="white"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-center font-medium">White</p>
          <p className="text-center text-xs text-gray-500">You move first</p>
          <p className="text-center text-xs text-gray-500">AI plays as Black</p>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-blue-300"
          onClick={() => onSelectColor("black")}
        >
          <div className="w-20 h-20 bg-gray-800 border border-gray-300 rounded-full flex items-center justify-center mb-2">
            <svg width="40" height="40" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.5 9C25.15 9 27.5 11.35 27.5 14C27.5 15.5 26.7 16.9 25.5 17.75C29.35 18.95 32 22.55 32 26.75V29.5H13V26.75C13 22.55 15.65 18.95 19.5 17.75C18.3 16.9 17.5 15.5 17.5 14C17.5 11.35 19.85 9 22.5 9Z"
                fill="black"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-center font-medium">Black</p>
          <p className="text-center text-xs text-gray-500">AI moves first</p>
          <p className="text-center text-xs text-gray-500">AI plays as White</p>
        </Card>
      </div>
    </div>
  )
}