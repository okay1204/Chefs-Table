class ipcRendererStateManager {

    initialize(ipcRenderer, setRecipes) {
        this.invoke = ipcRenderer.invoke;
        this.ipcRenderer = ipcRenderer;
        this.setRecipes = setRecipes;
        this.recipes = new Recipes(ipcRenderer, setRecipes);
    }
};

class Recipes {

    constructor(ipcRenderer, setRecipes) {
        this.ipcRenderer = ipcRenderer;
        this.setRecipes = setRecipes;
    }

    async webscrape(url) {
        const recipeData = await this.ipcRenderer.invoke('recipes:webscrape', url)

        if (!recipeData.error) {
            return recipeData.data;
        } else {
            return Promise.reject(recipeData.error);
        }
    }

    async add(recipes, newRecipe) {
        return this.ipcRenderer.invoke('recipes:add', newRecipe)
        .then(newRecipe => {
            this.setRecipes(
                recipes.concat([newRecipe])
            )
        });
    }

    async remove(recipes, recipeId) {
        return this.ipcRenderer.invoke('recipes:remove', recipeId)
        .then(removedRecipe => {
            this.setRecipes(
                [...recipes].filter(recipe => recipe.id !== recipeId)
            );
        });
    }

    async clear() {
        return this.ipcRenderer.invoke('recipes:clear')
        .then(() => this.setRecipes([]));
    }
}

export default new ipcRendererStateManager();