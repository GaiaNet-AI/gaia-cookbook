"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import "./../styles/thinking-animation.css";

export default function Home() {
  const [isConfigured, setIsConfigured] = useState<boolean>(true);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      maxSteps: 5,
    },
  });

  console.log(messages, "messages");

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Curvily fashion agent</CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] overflow-y-auto space-y-4">
          {!isConfigured ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Welcome to Omnipop chat</h3>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Start a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Type a message below to chat with the AI agent.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } gap-3 items-start`}
                >
                  {message.role !== "user" && (
                    <div className="flex flex-col items-center">
                      <Avatar className="h-10 w-10 border border-muted">
                        <AvatarImage
                          src="https://curvilyfashion.com/wp-content/uploads/2021/03/Snapseed-311134833.jpeg"
                          alt="Curvily"
                        />
                        <AvatarFallback>CV</AvatarFallback>
                      </Avatar>
                      <span className="text-xs mt-1 text-muted-foreground">
                        Curvily
                      </span>
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <MemoizedMarkdown
                      id={message.id}
                      content={message.content}
                    />
                  </div>

                  {message.role === "user" && (
                    <div className="flex flex-col items-center">
                      <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                        <AvatarFallback>
                          <User size={18} color="#ffffff" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs mt-1 text-muted-foreground">
                        You
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking indicator */}
              {isLoading && <ThinkingIndicator />}
              {error && (
                <p className="text-red-500">
                  {error.name} : {error.message}
                </p>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="w-full space-y-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="min-h-[80px]"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={!isConfigured || isLoading || !input.trim()}
            >
              {isLoading ? "Thinking..." : "Send Message"}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
