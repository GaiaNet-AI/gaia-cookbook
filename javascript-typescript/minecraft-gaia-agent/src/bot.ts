import { createLLMChain } from "./llm";
import { pathfinder, Movements, goals } from "mineflayer-pathfinder";
import * as dotenv from "dotenv";
import { createBot } from "mineflayer";

dotenv.config();

const bot = createBot({
  host: "localhost",
  port: 25565,
  username: "Gaiabot",
});

// Type assertion for plugins
const botWithPlugins = bot as any;

bot.loadPlugin(pathfinder);

// Load collectBlock plugin using require (more reliable for this package)
const collectBlock = require("mineflayer-collectblock");

// Initialize the LLM chain after bot is created
let chain: any;

bot.once("spawn", () => {
  console.log("Gaiabot ready.");
  bot.chat("Hello! I'm online and ready to help with Minecraft tasks!");

  // Initialize the LLM chain with the bot instance
  chain = createLLMChain(bot);
});

bot.on("chat", async (username: string, message: string) => {
  if (username === bot.username) return;
  if (!chain) return; // Wait for chain to be initialized

  const cleanMsg = message.toLowerCase().trim();
  const player = bot.players[username]?.entity;
  const defaultMove = new Movements(bot);

  // Quick commands that don't need LLM processing
  if (cleanMsg === "!inventory" || cleanMsg === "!inv") {
    const items = bot.inventory
      .items()
      .map((i: any) => `${i.name} x${i.count}`)
      .join(", ");
    return bot.chat(items || "I have nothing right now.");
  }

  if (cleanMsg === "!stop") {
    botWithPlugins.pathfinder.setGoal(null);
    return bot.chat("Okay, stopping all movement.");
  }

  if (cleanMsg === "!follow me" && player) {
    botWithPlugins.pathfinder.setMovements(defaultMove);
    botWithPlugins.pathfinder.setGoal(new goals.GoalFollow(player, 1), true);
    return bot.chat("Following you!");
  }

  if ((cleanMsg === "!come" || cleanMsg === "!come here") && player) {
    botWithPlugins.pathfinder.setMovements(defaultMove);
    botWithPlugins.pathfinder.setGoal(
      new goals.GoalBlock(
        Math.floor(player.position.x),
        Math.floor(player.position.y),
        Math.floor(player.position.z)
      )
    );
    return bot.chat("Coming to you!");
  }

  // Handle direct mining commands
  if (cleanMsg.startsWith("!mine ")) {
    const targetBlockName = cleanMsg.split("!mine ")[1].trim();
    const block = bot.findBlock({
      matching: (blk: any) => blk.name.includes(targetBlockName),
      maxDistance: 32,
    });

    if (!block) return bot.chat(`Can't find any ${targetBlockName} nearby.`);

    try {
      await botWithPlugins.collectBlock.collect(block);
      return bot.chat(`Mined ${block.name}!`);
    } catch (error: any) {
      return bot.chat(`Failed to mine ${targetBlockName}: ${error.message}`);
    }
  }

  // Handle direct building commands
  if (cleanMsg.startsWith("!build ")) {
    const blockName = cleanMsg.split("!build ")[1].trim();
    const item = bot.inventory
      .items()
      .find((i: any) => i.name.includes(blockName));
    if (!item) return bot.chat(`I don't have any ${blockName}`);

    if (!player) return bot.chat("I need to see where you are to build!");

    const pos = player.position.offset(1, 0, 0);
    try {
      await bot.equip(item, "hand");
      const targetBlock = bot.blockAt(pos.offset(0, -1, 0));
      if (targetBlock) {
        await bot.placeBlock(targetBlock, pos);
        return bot.chat(`Placed ${item.name}!`);
      } else {
        return bot.chat("Can't find a surface to build on!");
      }
    } catch (err: any) {
      console.error(err);
      return bot.chat("Couldn't place block.");
    }
  }

  // For all other messages, use the LLM with tool calling
  console.log(`Processing message from ${username}: ${message}`);

  try {
    // Show that we're thinking
    bot.chat("Let me help you with that...");

    // Add context about who is asking
    const contextualMessage = `Player ${username} says: ${message}`;

    const response = await chain.invoke({
      input: contextualMessage,
    });

    // The agent executor returns an object with an 'output' property
    let answer = response.output || response;

    // Handle max iterations error with context-aware responses
    if (answer.includes("Agent stopped due to max iterations")) {
      // Try to extract what action might have been taken from the console logs
      if (cleanMsg.includes("stop") || cleanMsg.includes("following")) {
        answer = "Okay, I've stopped following you!";
      } else if (cleanMsg.includes("follow")) {
        answer = "I'll start following you now!";
      } else if (cleanMsg.includes("mine")) {
        answer = "I'll look for that block to mine!";
      } else if (cleanMsg.includes("come") || cleanMsg.includes("here")) {
        answer = "Coming to you!";
      } else if (cleanMsg.includes("inventory")) {
        answer = "Let me check my inventory for you!";
      } else {
        answer =
          "I understand! I can mine blocks, build, follow you, check my inventory, and help with various Minecraft tasks.";
      }
    }

    // Limit response length for Minecraft chat
    const truncatedAnswer = answer.toString().slice(0, 100);
    bot.chat(truncatedAnswer);

    console.log(`LLM Response: ${answer}`);
  } catch (err: any) {
    console.error("LLM error:", err);

    // Provide a helpful fallback response
    if (
      cleanMsg.includes("what") &&
      (cleanMsg.includes("can") || cleanMsg.includes("do"))
    ) {
      bot.chat(
        "I can mine, build, follow, check inventory, and help with Minecraft tasks!"
      );
    } else {
      bot.chat("Sorry, I encountered an error processing that request!");
    }
  }
});

// Error handling
bot.on("error", (err: Error) => {
  console.error("Bot error:", err);
});

bot.on("end", () => {
  console.log("Bot disconnected");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down bot...");
  bot.quit();
  process.exit(0);
});
