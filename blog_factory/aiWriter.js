require('dotenv').config({ path: '../.env' }); //dev

const { scrapeContent } = require('./webscraper');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function promptGPT(prompt, max_tokens = 100) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: "Você é um assistente útil." },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens
        });

        const content = completion.choices[0].message.content.trim();
        return content.split('\n').map(item => item.trim());
    } catch (error) {
        console.error('Error generating content:', error);
        throw new Error('Failed to generate content');
    }
}

async function main() {
    try {
        const scrapedContent = await scrapeContent('top 10 smartphones August 2024');
        console.log(`Scraped Content:\n${scrapedContent}`);

        const prompt = `Based on the following data about the top 10 smartphones as of August 2024, generate a summary of the key features and advantages of these smartphones.\n\n${scrapedContent}`;
        const summary = await promptGPT(prompt, 4096);
        
        console.log(`Generated Summary:\n${summary}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();

module.exports = {
    promptGPT
};
