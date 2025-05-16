import { ethers } from 'ethers';
import { ContractCompiler } from './ContractCompiler.js';
import { MEME_COIN_CONTRACT } from './contractTemplate.js';

export class MemeDeployer {
    constructor(privateKey, nodeUrl) {
        this.provider = new ethers.JsonRpcProvider(nodeUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.chainId = 84532; // Base Sepolia chain ID
    }

    async initialize() {
        try {
            const network = await this.provider.getNetwork();
            console.log(`Deployer address: ${this.wallet.address}`);

            if (!this.provider) {
                throw new Error("Failed to connect to Base Sepolia");
            }

            if (network.chainId !== BigInt(this.chainId)) {
                throw new Error(`Wrong network. Expected Base Sepolia (84532), got ${network.chainId}`);
            }
        } catch (error) {
            throw new Error(`Initialization error: ${error.message}`);
        }
    }

    async deployContract(name, symbol, totalSupply) {
        try {
            // Replace placeholders in contract template
            const contractSource = MEME_COIN_CONTRACT
                .replace(/{TOKEN_NAME}/g, name)
                .replace(/{TOKEN_SYMBOL}/g, symbol)
                .replace(/{TOTAL_SUPPLY}/g, totalSupply.toString());

            console.log("Compiling contract...");
            const { abi, bytecode } = await ContractCompiler.compileContract(contractSource);

            // Create contract factory with higher gas limit
            const factory = new ethers.ContractFactory(abi, bytecode, this.wallet);

            console.log("Deploying contract...");
            const contract = await factory.deploy({
                gasLimit: 5000000  // Increased gas limit
            });
            console.log("Waiting for deployment confirmation...");
            
            const receipt = await contract.deploymentTransaction().wait();

            return {
                contract_address: await contract.getAddress(),
                transaction_hash: receipt.hash,
                abi: abi,
                gas_used: receipt.gasUsed.toString(),
                block_number: receipt.blockNumber
            };

        } catch (error) {
            throw new Error(`Deployment error: ${error.message}`);
        }
    }
}