export async function GET() {
    const models = [
      {
        id: "metamask",
        name: "MetaMask AI",
        provider: "Gaia",
        description: "AI model specialized for MetaMask and Ethereum interactions",
        baseURL: "https://metamask.gaia.domains/v1",
      },
      {
        id: "base",
        name: "Base AI",
        provider: "Gaia",
        description: "AI model optimized for Base blockchain development",
        baseURL: "https://base.gaia.domains/v1",
      },
      {
        id: "polygon",
        name: "Polygon AI",
        provider: "Gaia",
        description: "AI model specialized for Polygon ecosystem",
        baseURL: "https://polygon.gaia.domains/v1",
      },
      {
        id: "scroll",
        name: "Scroll AI",
        provider: "Gaia",
        description: "AI model for Scroll L2 blockchain interactions",
        baseURL: "https://scroll.gaia.domains/v1",
      },
      {
        id: "zksync",
        name: "zkSync AI",
        provider: "Gaia",
        description: "AI model specialized for zkSync Era development",
        baseURL: "https://zksync.gaia.domains/v1",
      },
    ]
  
    return Response.json(models)
  }
  
  export async function POST(req: Request) {
    try {
      const { id, name, provider, description } = await req.json()
      const newModel = { id, name, provider, description }
      return Response.json({ success: true, model: newModel })
    } catch (error) {
      return Response.json({ success: false, error: "Failed to add model" }, { status: 500 })
    }
  }
  