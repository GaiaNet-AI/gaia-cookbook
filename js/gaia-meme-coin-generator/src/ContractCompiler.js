import solc from 'solc';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ContractCompiler {
    static createSources(contractSource) {
        return {
            'Token.sol': {
                content: contractSource
            }
        };
    }

    static createInput(sources) {
        return {
            language: 'Solidity',
            sources,
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                },
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };
    }

    static findImports(path) {
        try {
            const nodeModulesPath = resolve(__dirname, '../node_modules');
            const fullPath = resolve(nodeModulesPath, path);
            const content = fs.readFileSync(fullPath, 'utf8');
            return { contents: content };
        } catch (error) {
            console.error(`Error loading import ${path}:`, error);
            return { error: 'File not found' };
        }
    }

    static async compileContract(contractSource) {
        try {
            const sources = this.createSources(contractSource);
            const input = this.createInput(sources);

            const output = JSON.parse(
                solc.compile(JSON.stringify(input), { import: this.findImports })
            );

            if (output.errors) {
                const errors = output.errors.filter(error => error.severity === 'error');
                if (errors.length > 0) {
                    throw new Error(
                        `Compilation errors:\n${errors.map(e => e.formattedMessage).join('\n')}`
                    );
                }
            }

            const contractFile = Object.keys(output.contracts['Token.sol'])[0];
            const contract = output.contracts['Token.sol'][contractFile];

            return {
                abi: contract.abi,
                bytecode: contract.evm.bytecode.object
            };
        } catch (error) {
            throw new Error(`Compilation error: ${error.message}`);
        }
    }
}