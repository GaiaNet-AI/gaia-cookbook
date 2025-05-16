import dotenv from 'dotenv';
import { generateTokenName, generateTokenomics } from './tokenGenerator.js';
import { TokenDeployer } from './tokenDeployer.js';

dotenv.config();

async function main() {
    try {
        // Generate token details
        const { name, symbol } = await generateTokenName();
        const { initialSupply } = generateTokenomics();

        // Initialize deployer with Celo Alfajores testnet
        const deployer = new TokenDeployer(
            process.env.PRIVATE_KEY,
            'https://alfajores-forno.celo-testnet.org'
        );

        // Deploy token
        await deployer.deployToken(name, symbol, initialSupply);
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

main();