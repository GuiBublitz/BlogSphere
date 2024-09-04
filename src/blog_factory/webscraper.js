const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const axios = require('axios');

puppeteer.use(StealthPlugin());

async function getGoogleSearchResults(query) {
    const browser = await puppeteer.launch({ 
        headless: true,  // Set to false for debugging if needed
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
        ],
    });
    const page = await browser.newPage();

    // Set a user-agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');

    // Log requests for debugging
    page.on('requestfailed', request => {
        console.log(`Request failed: ${request.url()} - ${request.failure().errorText}`);
    });

    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

    // Increase timeout to 60 seconds
    await page.waitForSelector('div.g', { timeout: 60000 });

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

// Debugging logs: Use `DEBUG=puppeteer:* node aiWriter.js` to get detailed Puppeteer logs.
