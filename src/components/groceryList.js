import '../styles/groceryList.css'

import React from 'react'
import BoxWindow from './boxWindow.js'

import DeleteIcon from '../images/delete.png'

const { ipcRenderer } = window.require('electron')

class GroceryList extends React.Component {
    constructor() {
        super()

        this.state = {
            loading: true,
            ingredients: {},
            recipes: {},
            newIngredient: '',
            copyAsTextClickChange: false
        }



        this.addIngredient = this.addIngredient.bind(this)
        this.ingredientHTML = this.ingredientHTML.bind(this)
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

                if (!recipeId) {
                    recipeId = -1
                }

                if (!(recipeId in sortedIngredients)) {
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

        ipcRenderer.invoke('groceryList:add', name, null)
        .then(({name, id}) => {
            ingredients[-1].push({name, id})
    
            this.setState({ingredients})
        })
    }

    ingredientHTML(recipeId, ingredient) {
        return (
            <div className='grocery-list-ingredient' key={ingredient.id}>
                <input id={`grocery-list-ingredient-${ingredient.id}`} type='checkbox' />
                <label htmlFor={`grocery-list-ingredient-${ingredient.id}`}>{ingredient.name}</label>
                <div className='grocery-list-ingredient-delete'>
                    <img src={DeleteIcon} alt='delete ingredient' onClick={() => {
                        const { ingredients } = this.state
                        const recipeIngredients = ingredients[recipeId]

                        // find index of the ingredient id to delete
                        let removeIndex
                        for (let i = 0; i < recipeIngredients.length; i++) {
                            if (recipeIngredients[i].id === ingredient.id) {
                                removeIndex = i
                                break
                            }
                        }

                        // delete ingredient
                        recipeIngredients.splice(removeIndex, 1)
                        ipcRenderer.invoke('groceryList:remove', ingredient.id)

                        // if the ingredients under that recipe are all empty, get rid of the recipe entirely
                        if (recipeIngredients.length === 0) {
                            delete ingredients[recipeId]
                        }
                        
                        this.setState({ingredients})
                    }}/>
                </div>
            </div>
        )
    }

    render() {

        const ingredientsHTML = []

        if (!this.state.loading) {
            // first rendering ingredients without a recipe

            if (this.state.ingredients[-1].length > 0) {
                ingredientsHTML.push(
                    <div className='grocery-list-recipe-category' key={-1}>
                        <h3>{this.state.recipes[-1]}</h3>
                        {this.state.ingredients[-1].map(ingredient => this.ingredientHTML(-1, ingredient))}
                    </div>
                )
            }
    
    
            for (const [recipeId, ingredients] of Object.entries(this.state.ingredients)) {
                if (recipeId !== '-1') {
                    ingredientsHTML.push(
                        <div className='grocery-list-recipe-category' key={recipeId}>
                            <h3>{this.state.recipes[recipeId]}</h3>
                            {ingredients.map(ingredient => this.ingredientHTML(recipeId, ingredient))}
                        </div>
                    )
                }
            }
        }

        return (
            <BoxWindow className='grocery-list' unmount={this.props.unmount} loading={this.state.loading}>
                
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
                        }}/>

                        <button className='grocery-list-add-button' onClick={() => {
                            this.addIngredient(this.state.newIngredient)
                            this.setState({newIngredient: ''})
                        }}>+</button>

                        <br />
                        <button className='grocery-list-copy-button' onClick={() => {
                            let text = ''

                            for (const [recipeId, ingredients] of Object.entries(this.state.ingredients)) {
                                text += this.state.recipes[recipeId] + '\n'
                                text += '----------\n'

                                ingredients.forEach(ingredient => text += ingredient.name + '\n')
                                text += '\n\n'
                            }

                            text = text.trim()

                            navigator.clipboard.writeText(text)

                            if (!this.state.copyAsTextClickChange) {
                                this.setState({copyAsTextClickChange: true})
                                setTimeout(() => this.setState({copyAsTextClickChange: false}), 1000)
                            }
                        }}>
                            {!this.state.copyAsTextClickChange ? 'Copy as Text' : 'Copied!'}
                        </button>
                        
                        <button className='grocery-list-clear-button'>
                            Delete All
                        </button>

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