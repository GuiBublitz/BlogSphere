const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const axios = require('axios');

// Use Stealth Plugin to avoid detection by Google
puppeteer.use(StealthPlugin());

async function getGoogleSearchResults(query) {
    const browser = await puppeteer.launch({
        headless: true, // Run in headless mode
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

    // Set random user agent to further reduce detection risk
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Go to Google search results page
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for search results to appear, with extended timeout
    await page.waitForSelector('div.g', { timeout: 60000 });

    // Extract the top 5 links from Google search results
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div.g a'))
            .slice(0, 5)
            .map(anchor => anchor.href);
    });

    await browser.close();
    return links;
}

async function extractUsefulContent(url) {
    try {
        const { data } = await axios.get(url); // Fetch website content
        const $ = cheerio.load(data); // Load HTML into Cheerio for parsing

        let content = '';
        // Extract all text from paragraphs and headers (h1, h2, h3)
        $('p, h1, h2, h3').each((i, element) => {
            content += $(element).text().trim() + '\n';
        });

        return content;
    } catch (error) {
        console.error(`Error extracting content from ${url}:`, error);
        return ''; // Return empty string if an error occurs
    }
}

async function scrapeContent(query, maxTokens = 100000) {
    try {
        const urls = await getGoogleSearchResults(query); // Get Google search result URLs
        console.log('Google Search URLs:', urls);

        const allContent = await scrapeMultipleWebsites(urls); // Scrape content from each URL

        // Combine content from all websites
        let aggregatedContent = allContent.join('\n\n');

        // Truncate content if it exceeds the token limit
        aggregatedContent = truncateToTokenLimit(aggregatedContent, maxTokens);

        return aggregatedContent;
    } catch (error) {
        console.error('Error during scraping process:', error);
        throw new Error('Failed to scrape and return content');
    }
}

async function scrapeMultipleWebsites(urls) {
    const allContent = [];

    // Iterate over URLs and extract content
    for (const url of urls) {
        const content = await extractUsefulContent(url);
        if (content) {
            allContent.push(content);
        }
    }

    return allContent;
}

// Approximate token count (1 token = ~4 characters)
function countTokens(text) {
    const approximateTokenCount = Math.ceil(text.length / 4);
    return approximateTokenCount;
}

// Truncate content to ensure it stays within the max token limit
function truncateToTokenLimit(text, maxTokens) {
    const tokens = text.split(/\s+/); // Split text into tokens (by spaces)
    let truncatedText = '';
    let tokenCount = 0;

    // Accumulate tokens until we reach the max token limit
    for (const token of tokens) {
        tokenCount += countTokens(token);
        if (tokenCount > maxTokens) {
            break;
        }
        truncatedText += token + ' ';
    }

    return truncatedText.trim(); // Return the truncated text
}

module.exports = {
    scrapeContent,
};
