import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
    baseURL: 'https://llama8b.gaia.domains/v1',
    apiKey: process.env.GAIA_API_KEY
});

export async function generateTokenName() {
    try {
        const completion = await openai.chat.completions.create({
            model: "llama",
            messages: [{
                role: "system",
                content: "You are a creative assistant that generates meme token names. Respond only with the token name and symbol in the exact format: TokenName|SYMBOL"
            }, {
                role: "user",
                content: "Generate a creative and funny meme token name and symbol."
            }],
            max_tokens: 50,
            temperature: 0.7,
            stop: ["\n"]
        });

        if (completion.choices && completion.choices[0]?.message?.content) {
            const suggestion = completion.choices[0].message.content.trim();
            const parts = suggestion.split('|');
            if (parts.length === 2) {
                const [name, symbol] = parts.map(s => s.trim());
                console.log('AI generated token:', { name, symbol });
                return { name, symbol };
            }
            throw new Error('Invalid AI response format');
        }
        throw new Error('Invalid API response structure');
        
    } catch (error) {
        console.error('Error generating token name:', error);
        
        const adjectives = [
            'Super', 'Mega', 'Ultra', 'Hyper', 'Epic', 
            'Cosmic', 'Crypto', 'Moon', 'Diamond'
        ];
        const nouns = [
            'Moon', 'Rocket', 'Star', 'Doge', 'Pepe',
            'Ape', 'Gem', 'Coin', 'Meme'
        ];
        
        const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
            nouns[Math.floor(Math.random() * nouns.length)]}`;
        const symbol = name.split(' ').map(word => word[0]).join('');
        
        console.log('Generated fallback token:', { name, symbol });
        return { name, symbol };
    }
}

export function generateTokenomics() {
    return {
        initialSupply: 1000000000 // 1 billion tokens
    };
}