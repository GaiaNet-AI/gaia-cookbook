import { ChatOpenAI } from "@langchain/openai";
import { DynamicTool } from "@langchain/core/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { goals, Movements } from "mineflayer-pathfinder";
import type { Bot } from "mineflayer";

export function createLLMChain(bot: Bot) {
  const model = new ChatOpenAI({
    model: "Meta-Llama-3.1-8B-Instruct-Q5_K_M",
    configuration: {
      apiKey: `${process.env.GAIA_API_KEY}`,
      baseURL: "https://trees.gaia.domains/v1",
    },
    temperature: 0.3,
  });

  const tools = [
    new DynamicTool({
      name: "mine_block",
      description:
        "Mine a specific type of block near the bot. Provide the block type as input (e.g., 'stone', 'coal', 'iron').",
      func: async (blockType: string): Promise<string> => {
        try {
          const block = bot.findBlock({
            matching: (blk: any) => blk.name.includes(blockType.toLowerCase()),
            maxDistance: 32,
          });

          if (!block) {
            return `Could not find any ${blockType} blocks nearby (within 32 blocks).`;
          }

          await (bot as any).collectBlock.collect(block);
          return `Successfully mined ${block.name} at position ${block.position.x}, ${block.position.y}, ${block.position.z}.`;
        } catch (error: any) {
          return `Failed to mine ${blockType}: ${error.message}`;
        }
      },
    }),

    new DynamicTool({
      name: "place_block",
      description:
        "Place a block from inventory. Provide the block type to place (e.g., 'stone', 'dirt', 'cobblestone').",
      func: async (blockType: string): Promise<string> => {
        try {
          const item = bot.inventory
            .items()
            .find((i: any) =>
              i.name.toLowerCase().includes(blockType.toLowerCase())
            );

          if (!item) {
            return `I don't have any ${blockType} in my inventory.`;
          }

          // Get the player who last spoke to determine placement location
          const players = Object.values(bot.players);
          const nearestPlayer = players.find(
            (p: any) => p.entity && p.entity.position
          );

          if (!nearestPlayer || !nearestPlayer.entity) {
            return "No player nearby to place block next to.";
          }

          const pos = nearestPlayer.entity.position.offset(1, 0, 0);
          await bot.equip(item, "hand");
          await bot.placeBlock(bot.blockAt(pos.offset(0, -1, 0))!, pos);

          return `Successfully placed ${item.name} next to the player.`;
        } catch (error: any) {
          return `Failed to place ${blockType}: ${error.message}`;
        }
      },
    }),

    new DynamicTool({
      name: "follow_player",
      description: "Follow a specific player. Provide the player's username.",
      func: async (playerName: string): Promise<string> => {
        try {
          const player = bot.players[playerName]?.entity;
          if (!player) {
            return `Could not find player ${playerName}. Available players: ${Object.keys(
              bot.players
            ).join(", ")}`;
          }

          const defaultMove = new Movements(bot);
          (bot as any).pathfinder.setMovements(defaultMove);
          (bot as any).pathfinder.setGoal(
            new goals.GoalFollow(player, 1),
            true
          );

          return `Now following ${playerName}.`;
        } catch (error: any) {
          return `Failed to follow ${playerName}: ${error.message}`;
        }
      },
    }),

    new DynamicTool({
      name: "go_to_player",
      description:
        "Move to a specific player's location. Provide the player's username.",
      func: async (playerName: string): Promise<string> => {
        try {
          const player = bot.players[playerName]?.entity;
          if (!player) {
            return `Could not find player ${playerName}. Available players: ${Object.keys(
              bot.players
            ).join(", ")}`;
          }

          const defaultMove = new Movements(bot);
          (bot as any).pathfinder.setMovements(defaultMove);
          (bot as any).pathfinder.setGoal(
            new goals.GoalBlock(
              Math.floor(player.position.x),
              Math.floor(player.position.y),
              Math.floor(player.position.z)
            )
          );

          return `Moving to ${playerName}'s location.`;
        } catch (error: any) {
          return `Failed to move to ${playerName}: ${error.message}`;
        }
      },
    }),

    new DynamicTool({
      name: "stop_movement",
      description: "Stop all current movement and following behavior.",
      func: async (): Promise<string> => {
        try {
          (bot as any).pathfinder.setGoal(null);
          return "Stopped all movement and following.";
        } catch (error: any) {
          return `Failed to stop movement: ${error.message}`;
        }
      },
    }),

    new DynamicTool({
      name: "check_inventory",
      description: "Check what items are currently in the bot's inventory.",
      func: async (): Promise<string> => {
        try {
          const items = bot.inventory.items();
          if (items.length === 0) {
            return "My inventory is empty.";
          }

          const itemList = items
            .map((item: any) => `${item.name} x${item.count}`)
            .join(", ");

          return `My inventory contains: ${itemList}`;
        } catch (error: any) {
          return `Failed to check inventory: ${error.message}`;
        }
      },
    }),

    new DynamicTool({
      name: "look_around",
      description:
        "Look around and describe nearby blocks, entities, and players.",
      func: async (): Promise<string> => {
        try {
          const nearbyBlocks = bot.findBlocks({
            matching: (block: any) => block.name !== "air",
            maxDistance: 10,
            count: 20,
          });

          const nearbyPlayers = Object.keys(bot.players).filter(
            (name: string) => name !== bot.username && bot.players[name].entity
          );

          const blockTypes = [
            ...new Set(nearbyBlocks.map((pos: any) => bot.blockAt(pos)?.name)),
          ]
            .filter(Boolean)
            .slice(0, 5);

          let description = `I can see these block types nearby: ${blockTypes.join(
            ", "
          )}.`;

          if (nearbyPlayers.length > 0) {
            description += ` Players nearby: ${nearbyPlayers.join(", ")}.`;
          }

          return description;
        } catch (error: any) {
          return `Failed to look around: ${error.message}`;
        }
      },
    }),
  ];

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are Gaiabot, a helpful Minecraft assistant. 

IMPORTANT: After using ANY tool, you MUST provide a brief response to the user about what you did.

Workflow:
1. User asks you to do something
2. Use the appropriate tool
3. Based on the tool result, give a short friendly response

Examples:
- User: "stop following me" → Use stop_movement tool → Respond: "Okay, stopped following!"
- User: "mine some stone" → Use mine_block tool → Respond: "Looking for stone to mine!"
- User: "what can you do" → Use respond_to_question tool → The tool will handle the response

Guidelines:
- Always use tools for actions, then respond about what you did
- Keep responses under 50 words
- Be friendly and conversational
- If a tool succeeds, acknowledge the success
- If a tool fails, acknowledge the failure and suggest alternatives`,
    ],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const agent = createToolCallingAgent({
    llm: model,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: true, // Enable to see what's happening
    maxIterations: 2, // Keep lower to avoid loops
    returnIntermediateSteps: false,
    handleParsingErrors: true, // Handle parsing errors gracefully
  });
}
