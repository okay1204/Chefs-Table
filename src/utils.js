function setRecipeImage(recipe) {
    if (typeof recipe.image !== 'string') {
        recipe.image = URL.createObjectURL(new Blob([recipe.image]))
    }

    return recipe
}

function capitalize(string) {
    return string[0].toUpperCase() + string.substring(1)
}

function clamp(smaller, num, larger) {
    return Math.max(smaller, Math.min(num, larger))
}

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other']

export { setRecipeImage, capitalize, MEALS, clamp }