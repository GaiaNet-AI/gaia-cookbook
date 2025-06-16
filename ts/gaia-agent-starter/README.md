# Gaia Agent Starter

A simple starter kit that integrates AI capabilities with Gaia and Next.js, providing an easy foundation for building AI-powered applications.


![Gaia Agent](./public/image.png)

### Next.js Project Setup

1. Clone the repository:

```bash
git clone https://github.com/meowyx/gaia-agent-starter
cd gaia-agent-starter

```

1. Install dependencies:

```bash
pnpm install

```

1. Run the development server:

```bash
 pnpm dev

```

1. Open [http://localhost:3000](http://localhost:3000/) with your browser to see the result.

## Environment Setup

This project requires Gaia API credentials to function properly. Create a `.env.local` file based on the `.env.example`:

```bash
NEXT_PUBLIC_GAIA_API_BASE_URL=
NEXT_PUBLIC_GAIA_API_KEY=
```

### Getting Your API Key

1. Visit [gaianet.ai](https://gaianet.ai) and click on **Launch App**
2. Connect your Metamask wallet by clicking **CONNECT**
3. Access your profile settings by clicking on the profile dropdown and selecting **Setting**
4. Navigate to **Gaia API Keys** and click **Create API Key**
5. Name your API key and click **Create**

For more details, see the [Gaia authentication documentation](https://docs.gaianet.ai/getting-started/authentication).

### Choosing an API Base URL

You can find available public Gaia nodes [here.](https://docs.gaianet.ai/nodes).

## Project Structure

The project uses Next.js App Router. You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Features

- **Next.js 15**: Utilizes the latest version of Next.js for powerful full-stack capabilities.
- **React Server Components**: Adds components without sending additional client-side JavaScript.
- **Built-in Optimizations**: Automatic image, font, and script optimizations for improved UX and Core Web Vitals.
- **Advanced Routing & Nested Layouts**: Creates routes using the file system, supporting advanced routing patterns and UI layouts.
- **GaiaNet AI Integration**: Access to advanced AI functionalities through the Gaia.

## Learn More

- [GaiaNet AI Documentation](https://docs.gaianet.ai/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.