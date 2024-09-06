const axios = require('axios');
const cheerio = require('cheerio');

const apiKey = process.env.GOOGLE_API_KEY;
const cseId = process.env.GOOGLE_CSE_ID;
const apiUrl = process.env.GOOGLE_CUSTOMSEARCH_API_URL;

async function getGoogleSearchResults(query) {
    const params = {
        key: apiKey,
        cx: cseId,
        q: query,
        num: 5,
    };

    try {
        const response = await axios.get(apiUrl, { params });
        const results = response.data.items;

        if (results.length > 0) {
            return results.map(item => item.link);
        } else {
            return 'No results found.';
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        return 'Failed to fetch search results.';
    }
}

async function extractUsefulContent(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let content = '';
        $('p, h1, h2, h3').each((i, element) => {
            content += $(element).text().trim() + '\n';
        });

        return content;
    } catch (error) {
        console.error(`Error fetching content from ${url}:`, error);
        return '';
    }
}

async function scrapeContent(query, maxTokens = 100000) {
    try {
        const urls = await getGoogleSearchResults(query);
        console.log('Google Search URLs:', urls);

        const allContent = await scrapeMultipleWebsites(urls);
        let aggregatedContent = allContent.join('\n\n');

        aggregatedContent = truncateToTokenLimit(aggregatedContent, maxTokens);

        return aggregatedContent;
    } catch (error) {
        console.error('Error during scraping process:', error);
        throw new Error('Failed to scrape and return content');
    }
}

async function scrapeMultipleWebsites(urls) {
    const allContent = [];

    for (const url of urls) {
        const content = await extractUsefulContent(url);
        if (content) {
            allContent.push(content);
        }
    }

    return allContent;
}

function countTokens(text) {
    const approximateTokenCount = Math.ceil(text.length / 4); 
    return approximateTokenCount;
}

function truncateToTokenLimit(text, maxTokens) {
    const tokens = text.split(/\s+/);
    let truncatedText = '';
    let tokenCount = 0;

    for (const token of tokens) {
        tokenCount += countTokens(token);
        if (tokenCount > maxTokens) {
            break;
        }
        truncatedText += token + ' ';
    }

    return truncatedText.trim();
}

module.exports = {
    scrapeContent,
};
