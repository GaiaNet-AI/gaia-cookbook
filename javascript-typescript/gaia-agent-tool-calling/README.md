# Gaia Agent Tool Calling

A simple agent setup with tool calling and Gaia’s inferencing from a Gaianet node. This open-source project provides a Next.js 14 template for building AI chatbots with advanced model support and seamless integration with modern web technologies.

## Features

• Next.js 14 & App Router
▫ Advanced routing for seamless navigation and performance
▫ React Server Components (RSCs) and Server Actions for server-side rendering and improved speed

    •	AI SDK Integration
    ▫	Unified API for generating text, structured objects, and tool calls with LLMs
    ▫	Hooks for building dynamic chat and generative user interfaces
    ▫ Powered by Gaia

flexibility

## Model Providers

Powered by Gaia as it's inferencing provider. Setup is as easy as the below:

```ts
const openai = createOpenAI({
  apiKey: "Gaia",
  baseURL: process.env.GAIA_BASE_URL,
})
```

Check the [Provider setup file](https://github.com/GaiaNet-AI/gaia-cookbook/blob/main/javascript-typescript/gaia-agent-tool-calling/lib/ai/providers.ts) for context.


## Getting Started

### Prerequisites

    •	Node.js (v18+ recommended)
    •	pnpm package manager
    •	Vercel CLI (for deployment and environment management)

### Installation

1. Install dependencies:pnpm install

2. Set up environment variables:
   ▫ Copy ⁠.env.example⁠ to ⁠.env⁠ and fill in the required values.
   ▫ Alternatively, use Vercel Environment Variables for secure management.

3. Run the development server:pnpm dev
   Your app will be running at http://localhost:3000 ↗.

Notes
• Do not commit your .env⁠ file to avoid exposing sensitive credentials.
• For deployment, link your local instance with Vercel and GitHub:vercel link
vercel env pull

## Deployment

Deploy your own version to Vercel with one click or follow the Vercel deployment documentation ↗.

## Project Structure

    •	⁠app/⁠ — Next.js App Router and pages
    •	components/⁠ — Reusable UI components
    •	⁠hooks/⁠ — Custom React hooks
    •	⁠lib/⁠ — Utility libraries and agent logic
    •	public/⁠ — Static assets
    •	⁠tests/⁠ — Test suites

Built with ❤️ by tobySolutions
