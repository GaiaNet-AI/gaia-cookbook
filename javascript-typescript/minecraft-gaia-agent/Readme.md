# 🧠 Minecraft-GaiaBot

A Minecraft bot powered by an LLM with tool-calling capabilities (via [LangChain](https://js.langchain.com/)), built in TypeScript using [mineflayer](https://github.com/PrismarineJS/mineflayer). This bot can chat, follow players, mine, build, and intelligently respond to natural language prompts using structured tool execution.

---

## ⚙️ Features

- ✅ **Tool-calling agent architecture** - LLM directly calls functions instead of text parsing
- ✅ **Natural language understanding** - Ask in plain English, bot executes actions
- ✅ **Minecraft chat interaction** - Full in-game communication
- ✅ **Smart movement** - Follow players, pathfinding, stop/start commands
- ✅ **Mining automation** - Find and collect specific block types
- ✅ **Building capabilities** - Place blocks from inventory strategically
- ✅ **Inventory management** - Check contents and use items intelligently
- ✅ **Environment awareness** - Look around and describe surroundings
- ✅ **Fallback commands** - Quick `!` commands for immediate responses
- ✅ **Robust error handling** - Graceful failures with helpful feedback
- ✅ **Modular LLM provider** - Easy to swap between different AI models

---

## 🧩 Stack

- **Mineflayer** – Minecraft bot engine
- **LangChain Agents** – Tool-calling LLM orchestration with AgentExecutor
- **Gaia LLM** – Tool-capable language model (swappable)
- **mineflayer-pathfinder** – Advanced movement and navigation AI
- **mineflayer-collectblock** – Automated mining and block collection
- **TypeScript** – Strong typing and clean architecture

---

## Prerequisites

1. **Minecraft Server**: You need a running Minecraft server

   - Download from [minecraft.net](https://minecraft.net/download/server)
   - Or use Paper/Spigot for better performance
   - Make sure it's running on `localhost:25565` (or update `src/bot.ts`)

2. **Gaia API Key**: Get one from [gaia.domains](https://gaia.domains)

---

## 🚀 Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/yourname/minecraft-gaia-bot.git
cd minecraft-gaia-bot

# Install deps
pnpm install
```

> If you don't have `pnpm`, install it:

```bash
npm install -g pnpm
```

---

### 2. Add environment variables

Create a `.env` file:

```
GAIA_API_KEY=your_gaia_key_here
```

---

### 3. Start your Minecraft server

Make sure you have a Minecraft server running on `localhost:25565` or update the connection details in `src/bot.ts`.

---

### 4. Compile and run

```bash
pnpm ts-node src/bot.ts
```

The bot will connect and announce: "Hello! I'm online and ready to help with Minecraft tasks!"

---

## 💬 Commands and Natural Language

Use the in-game chat (press `T`) to communicate with the bot.

### 🔧 Quick Commands (Immediate Response)

| Command                | Behavior                                |
| ---------------------- | --------------------------------------- |
| `!follow me`           | Bot follows your player                 |
| `!stop`                | Bot stops all movement                  |
| `!come` / `!come here` | Bot walks to your current position      |
| `!inventory` / `!inv`  | Lists items in bot's inventory          |
| `!mine <block>`        | Mines a nearby block of specified type  |
| `!build <block>`       | Places a block of that type next to you |

---

### 🤖 Natural Language Examples (Tool-Calling)

The bot now uses **intelligent tool calling** instead of text parsing. When you speak naturally, the LLM decides which tools to use:

| Example Prompt                         | Tools Used                  | Behavior                     |
| -------------------------------------- | --------------------------- | ---------------------------- |
| `What can you do?`                     | `respond_to_question`       | Lists capabilities           |
| `Mine some iron ore`                   | `mine_block("iron")`        | Finds and mines iron ore     |
| `Follow me around`                     | `follow_player("username")` | Starts following you         |
| `Stop following me`                    | `stop_movement()`           | Stops all movement           |
| `Come to me`                           | `go_to_player("username")`  | Walks to your location       |
| `What's in your inventory?`            | `check_inventory()`         | Lists all items              |
| `Place some stone blocks`              | `place_block("stone")`      | Places stone from inventory  |
| `Look around and tell me what you see` | `look_around()`             | Describes nearby environment |

---

## 🛠 Architecture: Tool-Calling vs Text Parsing

### Old Approach (Text Parsing)

```javascript
// ❌ Fragile and error-prone
if (answer.includes("mine")) {
  const blockType = answer.split("mine")[1].trim().split(" ")[0];
  // Hope we parsed correctly...
}
```

### New Approach (Tool-Calling)

```javascript
// ✅ Structured and reliable
tools: [
  new DynamicTool({
    name: "mine_block",
    description: "Mine a specific type of block",
    func: async (blockType: string) => {
      // Direct function call with proper parameters
    },
  }),
];
```

**Benefits:**

- **More reliable** - No more guessing what the LLM meant
- **Better error handling** - Each tool handles its own edge cases
- **Chainable actions** - LLM can use multiple tools in sequence
- **Cleaner code** - No complex string parsing logic

---

## 🔧 Available Tools

The bot has these tools available to the LLM:

1. **`mine_block(blockType)`** - Find and mine specific blocks
2. **`place_block(blockType)`** - Place blocks from inventory
3. **`follow_player(username)`** - Follow a specific player
4. **`go_to_player(username)`** - Move to a player's location
5. **`stop_movement()`** - Stop all movement and following
6. **`check_inventory()`** - List inventory contents
7. **`look_around()`** - Describe nearby blocks and players
8. **`respond_to_question(question)`** - Handle general questions

---

## 🔁 Swapping LLMs

To use a different model, edit `src/llm/index.ts`:

### Gaia:

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    model: "Meta-Llama-3.1-8B-Instruct-Q5_K_M",
    configuration: {
      apiKey: `${process.env.GAIA_API_KEY}`,
      baseURL: "gaia-node-url/v1",
    },
    temperature: 0.3,
  });
```

**Important:** Make sure your model supports tool/function calling for the agent to work properly!

---

## 📦 Project Structure

```
minecraft-gaia-bot/
├── src/
│   ├── bot.ts           # Main bot logic with tool integration
│   └── llm/
│       └── index.ts     # LangChain Agent setup with tools
├── .env                 # API keys
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🐛 Troubleshooting

### "Agent stopped due to max iterations"

- The LLM couldn't decide which tool to use
- Bot will fall back to a helpful default response
- Try being more specific in your requests

### TypeScript compilation errors

- Make sure all dependencies are installed: `pnpm install`
- Check that your TypeScript version supports the syntax used

### Bot can't connect to Minecraft

- Ensure your Minecraft server is running on `localhost:25565`
- Update connection details in `src/bot.ts` if needed
- Check that the bot username isn't already taken

---

## 🛠 Future Improvements

- ✅ **Tool-calling agents** for reasoning-based execution
- 🔜 **Multi-step planning** - "Build a house" breaks down into smaller tasks
- 🔜 **Memory system** - Remember past conversations and actions
- 🔜 **Advanced building** - Structure templates and blueprints
- 🔜 **Combat capabilities** - Defend against mobs
- 🔜 **Resource management** - Smart inventory optimization
- 🔜 **Collaborative tasks** - Work with multiple players

---

## 🧠 Credits

Built with:

- [mineflayer](https://github.com/PrismarineJS/mineflayer) - Minecraft bot framework
- [LangChain.js](https://js.langchain.com/) - LLM agent orchestration
- [mineflayer-pathfinder](https://github.com/PrismarineJS/mineflayer-pathfinder) - Movement AI
- [mineflayer-collectblock](https://github.com/PrismarineJS/mineflayer-collectblock) - Mining automation
- [Gaia](https://gaia.domains/) - LLM API provider

---

## 📝 License

MIT License - feel free to modify and distribute!
