"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChat } from "ai/react";

export const Chat = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="h-full w-full space-y-4 max-w-3xl">
      <div 
        className="border-2 border-green-700 h-full max-h-96 rounded-lg p-4 space-y-6 justify-end overflow-y-scroll bg-cream-50 shadow-md"
        style={{ backgroundColor: "#fcf8e8" }}
      >
        {messages.length === 0 && (
          <div className="text-center italic text-green-800 opacity-70 mt-10">
            Start a conversation with MeowAI...
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className="my-3">
            {message.role === "user" ? (
              <div className="flex w-full justify-start">
                <div className="w-fit max-w-md bg-sage-100 text-green-900 rounded-2xl p-3 border border-green-200 shadow-sm"
                     style={{ backgroundColor: "#d4e2d4" }}>
                  <strong className="text-green-800">You:</strong> {message.content}
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-end">
                <div className="w-fit max-w-md bg-peach-100 text-brown-900 rounded-2xl p-3 border border-peach-200 shadow-sm"
                     style={{ backgroundColor: "#ffcb91", color: "#654321" }}>
                  <strong className="text-brown-800" style={{ color: "#5e3b1f" }}>MeowAI:</strong> {message.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <form className="flex gap-3" onSubmit={handleSubmit}>
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask MeowAI..."
          className="border-2 border-green-600 bg-cream-50 text-green-900 placeholder:text-green-400 focus-visible:ring-green-500"
          style={{ backgroundColor: "#fcf8e8" }}
        />
        <Button 
          type="submit" 
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 border-2 border-green-700 shadow-md transition-all hover:shadow-lg"
          style={{ backgroundColor: "#7d9d7d", borderColor: "#5c8a5c" }}
        >
          Send
        </Button>
      </form>
    </div>
  );
};
