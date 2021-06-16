function setRecipeImage(recipe) {
    if (typeof recipe.image !== 'string') {
        recipe.image = URL.createObjectURL(new Blob([recipe.image]))
    }

    return recipe
}

export { setRecipeImage }