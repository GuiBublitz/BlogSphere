require('dotenv').config({ path: '../../.env' }); //dev

const { scrapeContent } = require('./webscraper');
const { getImagesByKeyword } = require('./imageSearcher');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function promptGPT(prompt, model = "gpt-4o-mini", max_tokens = 100) {
    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: "Você é um assistente útil." },
                { role: "user", content: prompt },
            ],
            max_tokens
        });

        const content = completion.choices[0].message.content.trim();
        return content;
    } catch (error) {
        console.error('Erro ao gerar conteúdo:', error);
        throw new Error('Falha ao gerar conteúdo');
    }
}

async function getList(theme) {
    try {
        const scrapedContent = await scrapeContent(theme);
        console.log(scrapedContent);
        const prompt = `Com base nos seguintes dados dos 3 principais sites que falam sobre ${theme.toLowerCase()}, você selecionar os mais relevantes, do melhor para o pior. Gere APENAS uma lista simples, de 1 a 10, com apenas o nome (nada mais do que isso) do que você acha que deve ser o top 10 considerando os seguintes dados:\n\n${scrapedContent}`;
        const summary = await promptGPT(prompt, "gpt-4o");
        return [summary.split('\n').map(item => item.trim()), scrapedContent];
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function generateBlogContent(theme) {
    const [itemList, scrapedContent] = await getList(theme);
    console.log(itemList);
    if (!itemList || itemList.length === 0) {
        console.log('Nenhum item encontrado para gerar conteúdo.');
        return;
    }

    for (const item of itemList) {
        let imageLinks = await getImagesByKeyword(item);
        const prompt = `Com base nos dados coletados: ${scrapedContent}\n\n Gere um tópico de post de blog sobre ${item}.\n  Com no máximo 1000 caracteres. Coloque o conteudo seguindo exatamente esse formato: <div><h3>titulo</h3><img><p>conteudo</p></div>, e adicione essa imagem ${imageLinks[0]} a tag img como titulo do topico`;
        const blogContent = await promptGPT(prompt, "gpt-4o", 450);
        console.log(`Conteúdo do blog para ${item}:\n${blogContent}\n`);

        await new Promise(resolve => setTimeout(resolve, 60000));
    }
}

generateBlogContent('top personagens mais fortes de jujutsu kaisen');

module.exports = {
    promptGPT
};
