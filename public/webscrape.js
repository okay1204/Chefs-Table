const axios = require('axios')
const HTMLParser = require('node-html-parser')
const Url = require('url-parse')
const he = require('he')

const ALL_PROTEINS = ['chicken', 'beef', 'fish', 'salmon', 'shrimp']

class DomainUnsupportedError extends Error {
    constructor(message) {
        super(message)
        Error.captureStackTrace(this, this.constructor)

        this.code = 'DOMAIN_UNSUPPORTED'
    }
}

class DomainRequestError extends Error {
    constructor(message) {
        super(message)
        Error.captureStackTrace(this, this.constructor)

        this.code = 'DOMAIN_REQUEST_ERROR'
    }
}

class WebScrape {

    static proteinFromName(name) {

        let lowerNameArray = name.toLowerCase().split(' ')
        lowerNameArray.map((word) => word.trim())


        let protein = null
        
        for (let i = 0; i < ALL_PROTEINS.length; i++) {
            const proteinName = ALL_PROTEINS[i]
            if (lowerNameArray.includes(proteinName)) {
                protein = proteinName
                break
            }
        }

        return protein
    }

    static async getResponse(url, options = {}) {
        try {
            return await axios.get(url, options)
        } catch {
            throw new DomainRequestError('Request to URL failed')
        }

    }

    static async getRecipeData(url) {
        const parsedUrl = new Url(url)

        let result

        switch (parsedUrl.hostname) {
            case 'cooking.nytimes.com':
                result = this.nyTimes(url)
                break
            case 'www.allrecipes.com':
                result = this.allRecipes(url)
                break
            // case 'cdn2.greenchef.com':
            // case 'www.greenchef.com':
            //     result = this.greenChef(url)
            //     break

            default:
                throw new DomainUnsupportedError('Recipe domain not supported')
        }

        return result
    }

    static async allRecipes(url) {
        const response = await this.getResponse(url)
        const root = HTMLParser.parse(response.data)
        const data = JSON.parse(root.querySelector('script').rawText)[1]

        const name = data.name
        const protein = this.proteinFromName(name)
        const ingredients = data.recipeIngredient

        const instructions = data.recipeInstructions.map((step) => step.text).join('')

        const timeString = data.totalTime.split('T')[1]
        const hours = parseInt(timeString.split('H')[0], 10)
        const minutes = parseInt(timeString.split('H')[1].replace('M', ''), 10)

        const servings = parseInt(data.recipeYield.split(' ')[0], 10)

        return {
            url,
            name,
            imageUrl: data.image.url,
            protein,
            ingredients,
            instructions,
            hours,
            minutes,
            servings
        }
    }

    static async nyTimes(url) {


        const response = await this.getResponse(url)
        const root = HTMLParser.parse(response.data)

        const name = root.querySelector('.recipe-title').rawText.trim()
        const imageUrl = root.querySelector('.recipe-intro .media-container picture img').attributes.src
        const protein = this.proteinFromName(name)

        
        let ingredientQuantities = root.querySelectorAll('.recipe-ingredients li .quantity')
        let ingredientNames = root.querySelectorAll('.recipe-ingredients li .ingredient-name')

        ingredientQuantities = ingredientQuantities.map((element) => he.decode(element.innerHTML).trim())
        ingredientNames = ingredientNames.map((element) => element.innerHTML.trim())

        const ingredients = []

        for (let i = 0; i < ingredientNames.length; i++) {
            ingredients.push((ingredientQuantities[i] + ' ' + ingredientNames[i]).trim())
        }

        let instructions = root.querySelectorAll('.recipe-steps li')
        instructions = instructions.map(step => step.innerText).join('\n')

        const totalTime = root.querySelector('.recipe-time + span').innerText

        let minutes
        
        try {
            minutes = parseInt(/[0-9]*\ minutes/.exec(totalTime)[0].split(' ')[0], 10)
        } catch {
            minutes = 0
        }

        let hours

        try {
            hours = parseInt(/[0-9]*\ hours/.exec(totalTime)[0].split(' ')[0], 10)
        } catch {
            hours = 0
        }

        let servingsText = root.querySelector('.recipe-yield + span').innerText.split(' ')
        let servings = 0
        
        // go through each word and look for a number
        servingsText.forEach(word => {

            const intWord = parseInt(word, 10)

            if (intWord) {
                servings = intWord
            }
        })

        return {
            url,
            name,
            imageUrl,
            protein,
            ingredients,
            instructions,
            hours,
            minutes,
            servings
        }
    }

    // static async greenChef(url) {

    //     const parsedUrl = new Url(url)

    //     if (parsedUrl.hostname === 'www.greenchef.com') {
    //         const response = await this.getResponse(url)
    //         const root = HTMLParser.parse(response.data)

    //         let recipeCardLink = root
    //         .querySelector('a.jsx-3718205992.jsx-2719391612.jsx-3844972933.jsx-2085888330.jsx-2085888330')
    //         .attributes.href

    //         recipeCardLink = recipeCardLink.replace('////', '//')
    //         url = recipeCardLink
    //     }
        

    //     const response = await this.getResponse(url, {
    //         headers: {
    //             'Content-Type': 'text/pdf'
    //         }
    //     })
    //     const root = HTMLParser.parse(response.data)
    
    //     const fs = require('fs')
    //     fs.writeFileSync('./test.pdf', response.data)

    //     delete response.data
    //     console.log(response)
    // }
}

// WebScrape.getRecipeData('https://cooking.nytimes.com/recipes/1018131-braai-spiced-t-bone-steaks?action=click&module=Global%20Search%20Recipe%20Card&pgType=search&rank=16').then((result) => {
//      console.log(result)
// })

module.exports = { WebScrape, DomainUnsupportedError, DomainRequestError }