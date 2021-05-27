const axios = require('axios');
const HTMLParser = require('node-html-parser');
const Url = require('url-parse');

const ALL_PROTEINS = ['chicken', 'beef', 'veggie', 'fish', 'salmon', 'shrimp'];

class WebScrape {

    static proteinFromName(name) {

        let lowerNameArray = name.toLowerCase().split(' ');
        lowerNameArray.map((word) => word.trim());


        let protein = null;
        
        for (let i = 0; i < ALL_PROTEINS.length; i++) {
            const proteinName = ALL_PROTEINS[i];
            if (lowerNameArray.includes(proteinName)) {
                protein = proteinName;
                break;
            }
        };

        return protein;
    }

    static async getRecipeData(url) {
        const parsedUrl = new Url(url);

        let result;

        switch (parsedUrl.hostname) {
            case 'cooking.nytimes.com':
                result = this.nyTimes(url);
                break;
            case 'www.allrecipes.com':
                result = this.allRecipes(url);
                break;
            // case 'cdn2.greenchef.com':
            // case 'www.greenchef.com':
            //     result = this.greenChef(url);
            //     break;

            default:
                throw Error('Recipe domain not supported')
        }

        return result;
    }

    static async allRecipes(url) {
        const response = await axios.get(url);
        const root = HTMLParser.parse(response.data);
        const data = JSON.parse(root.querySelector('script').rawText)[1];

        const name = data.name;
        const protein = this.proteinFromName(name);

        return {
            url,
            image_url: data.image.url,
            name,
            protein
        };
    }

    static async nyTimes(url) {


        const response = await axios.get(url);
        const root = HTMLParser.parse(response.data);

        const name = root.querySelector('.recipe-title').rawText.trim()
        const image_url = root.querySelector('.recipe-intro .media-container picture img').attributes.src
        const protein = this.proteinFromName(name);

        return {
            url,
            image_url,
            name,
            protein
        };
    }

    static async greenChef(url) {

        const parsedUrl = new Url(url);

        if (parsedUrl.hostname === 'www.greenchef.com') {
            const response = await axios.get(url);
            const root = HTMLParser.parse(response.data);

            let recipeCardLink = root
            .querySelector('a.jsx-3718205992.jsx-2719391612.jsx-3844972933.jsx-2085888330.jsx-2085888330')
            .attributes.href;

            recipeCardLink = recipeCardLink.replace('////', '//');
            url = recipeCardLink;
        }
        

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'text/pdf'
            }
        });
        const root = HTMLParser.parse(response.data);
    
        const fs = require('fs');
        fs.writeFileSync('./test.pdf', response.data);

        delete response.data;
        console.log(response);
    }
}

// WebScrape.getRecipeData('https://cdn2.greenchef.com/uploaded/60955cf63f1611001489a41c.pdf').then((result) => {
//     console.log(result)
// })

module.exports = { WebScrape };