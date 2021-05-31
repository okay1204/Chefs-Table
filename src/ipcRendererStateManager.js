class ipcRendererStateManager {
    constructor(ipcRenderer, setRecipes) {
        this.invoke = ipcRenderer.invoke;

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

    async add(recipe) {
        return this.ipcRenderer.invoke('recipes:add', recipe)
        .then((newRecipes) => {this.setRecipes(newRecipes)});
    }

    async remove(recipeId) {
        return this.ipcRenderer.invoke('recipes:remove', recipeId)
        .then((newRecipes) => this.setRecipes(newRecipes));
    }

    async clear() {
        return this.ipcRenderer.invoke('recipes:clear')
        .then(() => this.setRecipes([]));
    }
}

export default ipcRendererStateManager;