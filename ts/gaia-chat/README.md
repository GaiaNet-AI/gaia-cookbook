# Gaia Chat

A Next.js-based chat application that integrates with multiple blockchain domains through Gaia's API.

![Gaia Chat Demo](gaia-chat.gif)

## Features

- Real-time chat interface powered by AI
- Multi-chain support including:
  - MetaMask
  - Base
  - Polygon
  - Scroll
  - ZKSync
- Streaming responses for better user experience

## Prerequisites

- Node.js 18+ 
- A Gaia API key
- npm, yarn, pnpm, or bun

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/meowyx/gaia-chat.git
cd gaia-chat
```

2. Install dependencies:
```bash

pnpm install

```

3. Create a `.env.local` file in the root directory and add your Gaia API key:
```env
GAIA_API_KEY=your_api_key_here
```

4. Run the development server:
```bash

pnpm dev

```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## API Configuration

The application supports multiple blockchain domains through Gaia's API. The model configuration is handled in `app/api/chat/route.ts`. Each domain has its own endpoint:

- MetaMask: `https://metamask.gaia.domains/v1`
- Base: `https://base.gaia.domains/v1`
- Polygon: `https://polygon.gaia.domains/v1`
- Scroll: `https://scroll.gaia.domains/v1`
- ZKSync: `https://zksync.gaia.domains/v1`



## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

.
