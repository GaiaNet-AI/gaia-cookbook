import type React from "react"
import "@/app/globals.css"

export const metadata = {
  title: "Research Agent",
  description: "An AI-powered research assistant",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        
          {children}
       
      </body>
    </html>
  )
}
