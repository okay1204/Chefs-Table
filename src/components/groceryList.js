import React from 'react'
import BoxWindow from './boxWindow.js'

import '../styles/groceryList.css'

const { ipcRenderer } = window.require('electron')

class GroceryList extends React.Component {
    constructor() {
        super()

        this.state = {
            loading: true,
            ingredients: {},
            recipes: {},
            newIngredient: ''
        }



        this.addIngredient = this.addIngredient.bind(this)
    }

    componentDidMount() {

        // recipe id of -1 means its not in a recipe

        ipcRenderer.invoke('groceryList:readAll')
        .then(ingredients => {
            const sortedIngredients = {
                '-1': []
            }

            ingredients.forEach(ingredient => {
                let { recipeId } = ingredient

                if (!(recipeId in sortedIngredients)) {

                    if (!recipeId) {
                        recipeId = -1
                    }

                    sortedIngredients[recipeId] = []
                }

                sortedIngredients[recipeId].push(ingredient)
            })

            const recipes = {
                '-1': 'No Recipe'
            }
            const promises = []
            for (const recipeId of Object.keys(sortedIngredients)) {
                if (recipeId !== '-1') {
                    promises.push(
                        ipcRenderer.invoke('recipes:readRecipe', recipeId)
                        .then(recipe => {
                            recipes[recipeId] = recipe.name
                        })
                    )
                }
            }

            Promise.all(promises).then(() => this.setState({ingredients: sortedIngredients, recipes, loading: false}))
        })
    }

    addIngredient(name) {
        const { ingredients } = this.state

        // TODO make request to main process to create an actual ingredient and return with the recipe
        ingredients[-1].push({name, recipeId: -69})

        this.setState({ingredients})
    }

    render() {

        const ingredientsHTML = []

        if (!this.state.loading) {
            // first rendering ingredients without a recipe

            if (this.state.ingredients[-1].length > 0) {
                ingredientsHTML.push(
                    <div className='grocery-list-recipe-category' key={-1}>
                        <h3>{this.state.recipes[-1]}</h3>
                        {this.state.ingredients[-1].map(ingredient => (
                            <div className='grocery-list-ingredient' key={ingredient.id}>
                                <input id={`grocery-list-ingredient-${ingredient.id}`} type='checkbox' />
                                <label htmlFor={`grocery-list-ingredient-${ingredient.id}`}>{ingredient.name}</label>
                            </div>
                        ))}
                    </div>
                )
            }
    
    
            for (const [recipeId, ingredients] of Object.entries(this.state.ingredients)) {
                if (recipeId !== '-1') {
                    ingredientsHTML.push(
                        <div className='grocery-list-recipe-category' key={recipeId}>
                            <h3>{this.state.recipes[recipeId]}</h3>
                            {ingredients.map(ingredient => (
                                <div className='grocery-list-ingredient' key={ingredient.id}>
                                    <input id={`grocery-list-ingredient-${ingredient.id}`} type='checkbox' />
                                    <label htmlFor={`grocery-list-ingredient-${ingredient.id}`}>{ingredient.name}</label>
                                </div>
                            ))}
                        </div>
                    )
                }
            }
        }

        return (
            <BoxWindow unmount={this.props.unmount} loading={this.state.loading}>
                
                <h1>Grocery List</h1>
                
                {!this.state.loading && (
                    <div>
                        <input className='grocery-list-add-input' type='text' placeholder='Add Ingredient...'
                        value={this.state.newIngredient}
                        onChange={event => this.setState({newIngredient: event.target.value})}
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                this.addIngredient(this.state.newIngredient)
                                this.setState({newIngredient: ''})
                            }
                        }}
                        />
                        <button className='grocery-list-add-button' onClick={() => {
                            this.addIngredient(this.state.newIngredient)
                            this.setState({newIngredient: ''})
                        }}>+</button>

                        <div className='grocery-list-ingredients'>
                            {ingredientsHTML}
                        </div>
                    </div>
                )}
            </BoxWindow>
        )
    }
}

export default GroceryList