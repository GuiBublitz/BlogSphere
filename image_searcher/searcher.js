const axios = require('axios');

const apiKey = process.env.GOOGLE_API_KEY;
const cseId = process.env.GOOGLE_CSE_ID;
const apiUrl = process.env.GOOGLE_CUSTOMSEARCH_API_URL;

async function getImagesByKeyword(keyword) {
    const params = {
        key: apiKey,
        cx: cseId,
        q: keyword,
        searchType: 'image',
        num: 5,
    };

    try {
        const response = await axios.get(apiUrl, { params });
        const images = response.data.items;

        if (images.length > 0) {
            return images.map(image => image.link);
        } else {
            return 'No images found.';
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        return 'Failed to fetch images.';
    }
}

module.exports = {
    getImagesByKeyword
};
