const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const axios = require('axios');

puppeteer.use(StealthPlugin());

async function getGoogleSearchResults(query) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

    await page.waitForSelector('div.g');

    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div.g a')).slice(0, 5).map(anchor => anchor.href);
    });

    await browser.close();
    return links;
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
