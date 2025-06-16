import { tool as createTool } from "ai"
import { z } from "zod"

export const greetingTool = createTool({
  description: "Respond to greetings and casual conversation in a friendly, welcoming way",
  parameters: z.object({
    messageType: z.enum(["greeting", "help", "about"]).describe("The type of message to respond to"),
  }),
  execute: async ({ messageType }) => {
    const responses = {
      greeting: {
        message:
          "Hi there! 🌸 Welcome to SheFi Cafe! I'm your friendly garden companion here to chat and help you learn about Web3 in a welcoming space. How are you today?",
      },
      help: {
        message:
          "I'd love to help! 🌿 I can tell you all about SheFi's 8-week program, discuss Web3 topics, or just chat about your journey in the space. What would you like to know more about?",
      },
      about: {
        message:
          "SheFi is designed to make Web3 learning accessible and inclusive! We offer an 8-week educational program with hands-on tech demos and amazing peer support. We're all about helping you grow your Web3 career in a supportive environment. 🌱",
      },
    }

    return responses[messageType]
  },
})

export const shefiInfoTool = createTool({
  description: "Provide information about SheFi's programs and community",
  parameters: z.object({
    topic: z.enum(["program", "community", "mission"]).describe("The aspect of SheFi to discuss"),
  }),
  execute: async ({ topic }) => {
    const information = {
      program: {
        message:
          "Our program is an 8-week journey that includes live classes, recorded sessions, and hands-on experience. Think of it as a garden where your Web3 knowledge can bloom! 🌺 We cover everything from blockchain basics to advanced concepts.",
      },
      community: {
        message:
          "SheFi has grown into a wonderful community of over 3,000 members from 90+ countries! We're like a global garden of Web3 enthusiasts, supporting each other's growth and learning. 🌍",
      },
      mission: {
        message:
          "At SheFi, we believe that the frontier is feminine. We're here to reinvent careers, shape the future of Web3, and make sure everyone has a chance to flourish in this space. 🌱",
      },
    }

    return information[topic]
  },
})

export const tools = {
  greet: greetingTool,
  shefiInfo: shefiInfoTool,
}

