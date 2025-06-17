"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ThinkingIndicator() {
  return (
    <div className="flex justify-start gap-3 items-start">
      <div className="flex flex-col items-center">
        <Avatar className="h-10 w-10 border border-muted">
          <AvatarImage
            src="https://curvilyfashion.com/wp-content/uploads/2021/03/Snapseed-311134833.jpeg"
            alt="Curvily"
          />
          <AvatarFallback>CV</AvatarFallback>
        </Avatar>
        <span className="text-xs mt-1 text-muted-foreground">Curvily</span>
      </div>

      <div className="bg-muted rounded-lg px-4 py-3 max-w-[75%]">
        <div className="flex items-center space-x-1">
          <div className="thinking-dot"></div>
          <div className="thinking-dot animation-delay-200"></div>
          <div className="thinking-dot animation-delay-400"></div>
        </div>
      </div>
    </div>
  );
}
