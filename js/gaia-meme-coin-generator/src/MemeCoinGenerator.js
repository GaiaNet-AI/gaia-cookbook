import OpenAI from 'openai';

export class MemeCoinGenerator {
    constructor(baseUrl, modelName, apiKey = "GAIANET") {
        this.client = new OpenAI({
            baseURL: baseUrl,
            apiKey: apiKey
        });
        this.model = modelName;
    }

    async verifyConnection() {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: "Test connection" }
                ],
                temperature: 0.7,
                max_tokens: 50
            });

            if (!response || !response.choices) {
                throw new Error("Invalid response format from API");
            }
            console.log("Successfully connected to Gaia node");
        } catch (error) {
            throw new Error(`Failed to connect to Gaia node: ${error.message}`);
        }
    }

    async generateCoinName(theme) {
        try {
            const themeContext = theme ? ` based on the theme: ${theme}` : '';
            const prompt = `Generate a creative and catchy name for a new meme cryptocurrency${themeContext}. 
            Strictly respond with only a JSON object in the following format:
            {
                "name": "CoinName",
                "symbol": "SYM",
                "description": "Brief description"
            }
            
            Requirements for the response:
            - name: Must be alphanumeric with no spaces (CamelCase)
            - symbol: 3-4 capital letters
            - description: Keep under 100 characters`;

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: "You are a cryptocurrency naming expert. Respond only with valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 150
            });

            let content = response.choices[0].message.content.trim();
            
            // Clean JSON response
            if (content.includes('```json')) {
                content = content.split('```json')[1].split('```')[0].trim();
            }

            const result = JSON.parse(content);

            // Validate response
            if (!result.name || !result.symbol || !result.description) {
                throw new Error("Missing required fields in response");
            }

            if (!result.name.replace('Token', '').match(/^[a-zA-Z0-9]+$/)) {
                throw new Error("Invalid coin name format");
            }

            if (!result.symbol.match(/^[A-Z]{3,4}$/)) {
                throw new Error("Invalid symbol format");
            }

            return result;

        } catch (error) {
            throw new Error(`Error generating coin name: ${error.message}`);
        }
    }

    async generateTokenomics(name) {
        try {
            const prompt = `Generate tokenomics data. Response must be ONLY a JSON object with these exact fields:
            {
                "total_supply": 500000000,
                "initial_liquidity_percent": 75,
                "transaction_limit_percent": 1,
                "max_wallet_percent": 2
            }`;

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { 
                        role: "system", 
                        content: "You are a tokenomics expert. Respond with ONLY the JSON object, no markdown formatting, no explanation." 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 100
            });

            let content = response.choices[0].message.content.trim();
            
            // Clean JSON response
            // Remove any markdown formatting
            content = content.replace(/^```json\s*/, '').replace(/```$/, '');
            content = content.replace(/^```\s*/, '').replace(/```$/, '');
            
            // Remove any explanatory text before or after the JSON
            content = content.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1');
            
            console.log("Raw tokenomics response:", content);
            
            try {
                const result = JSON.parse(content);

                // Validate tokenomics
                const requiredFields = [
                    'total_supply', 
                    'initial_liquidity_percent',
                    'transaction_limit_percent', 
                    'max_wallet_percent'
                ];

                if (!requiredFields.every(field => field in result)) {
                    throw new Error("Missing required fields in tokenomics");
                }

                // Convert and validate values
                const tokenomics = {
                    total_supply: parseInt(String(result.total_supply).replace(/,/g, '')),
                    initial_liquidity_percent: parseInt(String(result.initial_liquidity_percent)),
                    transaction_limit_percent: parseInt(String(result.transaction_limit_percent)),
                    max_wallet_percent: parseInt(String(result.max_wallet_percent))
                };

                if (tokenomics.total_supply < 100000000 || tokenomics.total_supply > 1000000000) {
                    throw new Error("Total supply out of valid range");
                }

                if (tokenomics.initial_liquidity_percent < 50 || tokenomics.initial_liquidity_percent > 90) {
                    throw new Error("Initial liquidity percentage out of valid range");
                }

                return tokenomics;
            } catch (parseError) {
                throw new Error(`Failed to parse JSON response: ${parseError.message}\\nContent: ${content}`);
            }

        } catch (error) {
            throw new Error(`Error generating tokenomics: ${error.message}`);
        }
    }
}