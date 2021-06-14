class ipcRendererStateManager {

    initialize(ipcRenderer, setRecipes) {
        this.invoke = ipcRenderer.invoke
        this.send = ipcRenderer.send
        
        this.ipcRenderer = ipcRenderer
        this.setRecipes = setRecipes
        this.recipes = new Recipes(ipcRenderer, setRecipes)
        this.ingredients = new Ingredients(ipcRenderer)
    }
}

class Recipes {

    constructor(ipcRenderer, setRecipes) {
        this.ipcRenderer = ipcRenderer
        this.setRecipes = setRecipes
    }

    async webscrape(url) {
        const recipeData = await this.ipcRenderer.invoke('recipes:webscrape', url)

        if (!recipeData.error) {
            return recipeData.data
        } else {
            return Promise.reject(recipeData.error)
        }
    }

    async add(recipes, newRecipe) {
        return this.ipcRenderer.invoke('recipes:add', newRecipe)
        .then(newRecipe => {
            this.setRecipes(
                recipes.concat([newRecipe])
            )
        })
    }

    async remove(recipes, recipeIdToRemove) {
        return this.ipcRenderer.invoke('recipes:remove', recipeIdToRemove)
        .then(removedRecipe => {
            this.setRecipes(
                [...recipes].filter(recipe => recipe.id !== recipeIdToRemove)
            )
        })
    }

    async clear() {
        return this.ipcRenderer.invoke('recipes:clear')
        .then(() => this.setRecipes([]))
    }
}

class Ingredients {

    constructor(ipcRenderer) {
        this.ipcRenderer = ipcRenderer
    }

    async add(ingredients, setIngredients, ingredient) {
        return this.ipcRenderer.invoke('ingredients:add', ingredient)
        .then((newIngredient) => setIngredients(
            ingredients.concat(newIngredient)
        ))
    }

    async remove(ingredients, setIngredients, ingredientIdToRemove) {
        return this.ipcRenderer.invoke('ingredients:add', ingredientIdToRemove)
        .then((removedIngredient) => setIngredients(
            [...ingredients].filter(ingredient => ingredient.id !== ingredientIdToRemove)
        ))
    }

    async clear(setIngredients, recipeId) {
        return this.ipcRenderer.invoke('ingredients:clear', recipeId)
        .then(() => setIngredients([]))
    }

}

export default new ipcRendererStateManager()