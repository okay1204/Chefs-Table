class ipcRendererStateManager {
    constructor(ipcRenderer, setRecipes) {
        this.raw = ipcRenderer;

        this.setRecipes = setRecipes;
        this.recipes = new Recipes(ipcRenderer, setRecipes);
    }
};

class Recipes {
    constructor(ipcRenderer, setRecipes) {
        this.ipcRenderer = ipcRenderer;
        this.setRecipes = setRecipes;
    }

    add(recipe) {
        this.ipcRenderer.invoke('recipes:add', recipe)
        .then((newRecipes) => this.setRecipes(newRecipes));
    }

    remove(recipeId) {
        this.ipcRenderer.invoke('recipes:remove', recipeId)
        .then((newRecipes) => this.setRecipes(newRecipes));
    }

    clear() {
        this.ipcRenderer.invoke('recipes:clear')
        .then(this.setRecipes([]));
    }
}

export default ipcRendererStateManager;