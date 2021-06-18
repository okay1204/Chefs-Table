function setRecipeImage(recipe) {
    if (typeof recipe.image !== 'string') {
        recipe.image = URL.createObjectURL(new Blob([recipe.image]))
    }

    return recipe
}

function capitalize(string) {
    return string[0].toUpperCase() + string.substring(1)
}

export { setRecipeImage, capitalize }