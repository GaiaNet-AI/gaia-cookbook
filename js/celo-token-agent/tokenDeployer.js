import Web3 from 'web3';
import { newKitFromWeb3 } from '@celo/contractkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TokenDeployer {
    constructor(privateKey, rpcUrl) {
        // Initialize Web3 and ContractKit
        const web3 = new Web3(rpcUrl);
        this.kit = newKitFromWeb3(web3);
        
        // Add account to wallet
        this.kit.addAccount(privateKey);
        
        try {
            const artifactPath = path.join(__dirname, './artifacts/contracts/MemeToken.sol/MemeToken.json');
            console.log('Reading artifacts from:', artifactPath);
            
            const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            this.contractBytecode = contractArtifact.bytecode;
            this.contractAbi = contractArtifact.abi;
        } catch (error) {
            console.error('Error reading contract artifacts:', error);
            throw new Error('Failed to load contract artifacts. Make sure you have run "npx hardhat compile" first.');
        }
    }

    async checkBalances(address) {
        const goldtoken = await this.kit.contracts.getGoldToken();
        const celoBalance = await goldtoken.balanceOf(address);
        
        console.log('Account balance:');
        console.log(`A-CELO: ${this.kit.web3.utils.fromWei(celoBalance.toString())} A-CELO`);
        
        if (celoBalance.isZero()) {
            throw new Error('Insufficient A-CELO. Please visit https://faucet.celo.org/alfajores to get test tokens');
        }
    }

    async deployToken(name, symbol, initialSupply) {
        try {
            // Get the default account
            const accounts = await this.kit.web3.eth.getAccounts();
            const defaultAccount = accounts[0];
            this.kit.defaultAccount = defaultAccount;

            console.log(`Deploying from account: ${defaultAccount}`);
            
            // Check balances before deployment
            await this.checkBalances(defaultAccount);

            // Create contract instance
            const contract = new this.kit.web3.eth.Contract(this.contractAbi);
            
            // Prepare deploy transaction
            const deploy = contract.deploy({
                data: this.contractBytecode,
                arguments: [name, symbol, initialSupply]
            });

            // Estimate gas
            const gas = await deploy.estimateGas();

            // Send deployment transaction
            console.log('Sending deployment transaction...');
            const tx = await new Promise((resolve, reject) => {
                deploy.send({
                    from: defaultAccount,
                    gas
                })
                .on('transactionHash', (hash) => {
                    console.log('Transaction sent! Hash:', hash);
                })
                .on('receipt', (receipt) => {
                    console.log('Deployment confirmed in block:', receipt.blockNumber);
                    resolve({
                        address: receipt.contractAddress,
                        transactionHash: receipt.transactionHash
                    });
                })
                .on('error', (error) => {
                    reject(error);
                });
            });

            console.log('Token deployed successfully!');
            console.log({
                name,
                symbol,
                address: tx.address,
                transactionHash: tx.transactionHash,
                explorer: `https://alfajores.celoscan.io/address/${tx.address}`
            });

            return tx;
        } catch (error) {
            console.error('Deployment error:', error);
            throw error;
        }
    }
}