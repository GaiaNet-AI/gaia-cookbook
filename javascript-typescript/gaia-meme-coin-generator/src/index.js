// src/index.js
import dotenv from 'dotenv';
import { MemeCoinAgent } from './MemeCoinAgent.js';

async function main() {
    // Load environment variables
    dotenv.config();

    // Configuration
    const required_env_vars = {
        GAIA_URL: process.env.GAIA_URL,
        GAIA_MODEL: process.env.GAIA_MODEL,
        BASE_NODE_URL: process.env.BASE_NODE_URL,
        PRIVATE_KEY: process.env.PRIVATE_KEY
    };

    // Check for missing environment variables
    const missing_vars = Object.entries(required_env_vars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing_vars.length > 0) {
        console.error(`Missing required environment variables: ${missing_vars.join(', ')}`);
        console.error("Please check your .env file");
        process.exit(1);
    }

    try {
        console.log("Initializing agent...");
        const agent = new MemeCoinAgent(
            required_env_vars.GAIA_URL,
            required_env_vars.GAIA_MODEL,
            required_env_vars.BASE_NODE_URL,
            required_env_vars.PRIVATE_KEY
        );

        await agent.initialize();

        console.log("Creating meme coin...");
        const result = await agent.createMemeCoin("cyber dogs in space");

        if (result) {
            console.log("\nMeme Coin Created Successfully!");
            console.log("=".repeat(50));
            console.log(`Name: ${result.token_details.name}`);
            console.log(`Symbol: ${result.token_details.symbol}`);
            console.log(`Description: ${result.token_details.description}`);
            console.log(`Contract Address: ${result.deployment_details.contract_address}`);
            console.log(`Transaction Hash: ${result.deployment_details.transaction_hash}`);
            console.log(`Block Number: ${result.deployment_details.block_number}`);
            console.log("\nTokenomics:");
            Object.entries(result.tokenomics).forEach(([key, value]) => {
                console.log(`${key}: ${value}`);
            });

            await agent.saveDeploymentDetails(result);

            console.log("\nVerify your contract on Base Sepolia Explorer:");
            console.log(`https://sepolia.basescan.org/address/${result.deployment_details.contract_address}`);
        } else {
            console.error("Failed to create meme coin. Check the error messages above.");
        }

    } catch (error) {
        console.error(`Error in meme coin creation process: ${error.message}`);
        if (error.cause) {
            console.error(`Caused by: ${error.cause}`);
        }
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);