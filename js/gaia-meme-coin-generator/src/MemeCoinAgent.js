// src/MemeCoinAgent.js
import { MemeCoinGenerator } from './MemeCoinGenerator.js';
import { MemeDeployer } from './MemeDeployer.js';
import fs from 'fs/promises';

export class MemeCoinAgent {
    constructor(gaia_url, gaia_model, base_node_url, private_key) {
        console.log("Initializing MemeCoin Agent...");
        this.generator = new MemeCoinGenerator(gaia_url, gaia_model);
        this.deployer = new MemeDeployer(private_key, base_node_url);
        this.deployment_history = [];
    }

    async initialize() {
        await this.deployer.initialize();
        await this.generator.verifyConnection();
    }

    async createMemeCoin(theme = null) {
        try {
            console.log("Generating coin details...");
            const coinDetails = await this.generator.generateCoinName(theme);
            console.log("Generated coin details:", JSON.stringify(coinDetails, null, 2));

            console.log("\nGenerating tokenomics...");
            const tokenomics = await this.generator.generateTokenomics(coinDetails.name);
            console.log("Generated tokenomics:", JSON.stringify(tokenomics, null, 2));

            console.log("\nDeploying contract...");
            const deploymentResult = await this.deployer.deployContract(
                coinDetails.name,
                coinDetails.symbol,
                tokenomics.total_supply
            );

            if (!deploymentResult) {
                throw new Error("Contract deployment failed");
            }

            const deploymentRecord = {
                timestamp: new Date().toISOString(),
                deployment_details: deploymentResult,
                token_details: coinDetails,
                tokenomics: tokenomics
            };

            this.deployment_history.push(deploymentRecord);
            return deploymentRecord;

        } catch (error) {
            throw new Error(`Error creating meme coin: ${error.message}`);
        }
    }

    getDeploymentHistory() {
        return this.deployment_history;
    }

    async saveDeploymentDetails(deployment_result, filename = "deployment_details.json") {
        try {
            await fs.writeFile(filename, JSON.stringify(deployment_result, null, 2));
            console.log(`Deployment details saved to ${filename}`);
        } catch (error) {
            console.error(`Error saving deployment details: ${error.message}`);
        }
    }
}