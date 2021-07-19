import '../styles/recipeBox.css'
import 'animate.css/animate.min.css'
import React from 'react'
import { setRecipeImage, capitalize } from '../utils.js'
import OutsideAnchor from '../components/outSideAnchor.js'
import BoxWindow from './boxWindow.js'

import LoadingWheel from '../images/loadingWheel.gif'
import EditBlack from '../images/editBlack.png'
import AddToListEmerald from '../images/addToListEmerald.png'
import ReactTooltip from 'react-tooltip'

const { ipcRenderer } = window.require('electron')

class RecipeBox extends React.Component {

    constructor() {
        super()
        
        this.state = {
            recipe: null,
            rawImage: null,
            loading: true,
            groceryAnimation: false,
            ingredientAnimationIds: []
        }
    }
    
    componentDidMount() {
        ipcRenderer.invoke('recipes:readRecipe', this.props.recipeId)
        .then((recipe) => {
            const rawImage = recipe.image
            this.setState({ recipe: setRecipeImage(recipe), rawImage, loading: false })
        })
    }
    
    componentDidUpdate() {
        ReactTooltip.rebuild()
    }
    
    render() {

        let ingredients
        // replace all \n in text to line break tags
        let recipeInstructions
        
        if (!this.state.loading) {

            let ingredientIdCount = 0

            ingredients = this.state.recipe.ingredients.map(name => {
                const ingredientId = ingredientIdCount++
                const checkboxClassname = 'recipe-box-ingredient-checkbox-' + ingredientId

                return (
                    <div key={ingredientId}>
                        <input type='checkbox' id={checkboxClassname}/>
                        <label htmlFor={checkboxClassname}>{name}</label>
                        <button onClick={() => {
                            if (!this.state.ingredientAnimationIds.includes(ingredientId)) {
                                this.setState({ingredientAnimationIds: this.state.ingredientAnimationIds.concat(ingredientId)})
                                ipcRenderer.invoke('groceryList:add', name, this.state.recipe.id)
                            }
                        }}>
                            <img src={AddToListEmerald} alt='Add ingredient to grocery list' data-tip='Add ingredient to grocery list' data-for='react-tooltip' data-place='right'/>
                        </button>

                        {/* Added hovering effect for add individual ingredients button */}
                        {
                            this.state.ingredientAnimationIds.includes(ingredientId) &&
                            <div className='recipe-box-ingredient-grocery-animation-wrapper'>
                                <span className='recipe-box-ingredient-grocery-animation'
                                    onAnimationEnd={() => this.setState({ingredientAnimationIds: [...this.state.ingredientAnimationIds.splice(ingredientId, 1)]})}
                                >
                                    Added
                                </span>
                            </div>
                        }
                    </div>
                )
            })




            let key = 0
            let splitInstructions = this.state.recipe.instructions.split('\n')
            recipeInstructions = []
            
            for (let i = 0; i < splitInstructions.length; i++) {
                recipeInstructions.push(<span key={key++}>{splitInstructions[i]}</span>)
                recipeInstructions.push(<br key={key++}/>)
            }
    
            recipeInstructions.pop()
        }

        return (

            <BoxWindow
                unmount={this.props.unmount}
                secondaryButton={{
                    img: EditBlack,
                    function: () => {
                        this.props.unmount()

                        this.props.openEditBox({
                            edit: this.props.recipeId,
                            url: this.state.recipe.url,
                            name: this.state.recipe.name,
                            protein: this.state.recipe.protein,
                            totalMinutes: this.state.recipe.totalMinutes,
                            servings: this.state.recipe.servings,
                            ingredients: this.state.recipe.ingredients,
                            meals: this.state.recipe.meals,
                            instructions: this.state.recipe.instructions,
                            // if image is using link, use link, otherwise pass in byte array
                            image: ['binary', 'none'].includes(this.state.recipe.imageType) ?
                            {
                                type: this.state.recipe.imageType,
                                data: this.state.rawImage
                            }
                            :
                            {
                                type: 'url',
                                data: this.state.recipe.image
                            }
                        })
                    }
                }}
            >
                {
                    this.state.loading
                    ? <div className='recipe-box-loading'><img src={LoadingWheel} alt='loading' /></div>
                    : (
                        <div className='recipe-box-content-wrapper'>

                            <h1>{this.state.recipe.name}</h1>

                            {/* eslint-disable-next-line */}
                            <div className='recipe-header'>
                                <img className='recipe-box-image' src={this.state.recipe.image} alt=''/>
                                <div className='recipe-info-box'>
                                    <span>Time: {`${Math.floor(this.state.recipe.totalMinutes / 60)}h ${this.state.recipe.totalMinutes % 60}m`}</span>
                                    <span>Servings: {this.state.recipe.servings}</span>
                                    <span>Protein: {this.state.recipe.protein ? capitalize(this.state.recipe.protein) : 'None'}</span>
                                </div>
                            </div>

                            <h3>Meals</h3>
                            <div className='recipe-box-meals-wrapper'>
                                {this.state.recipe.meals.length > 0 ? 
                                this.state.recipe.meals.map(meal => (
                                    <h5 key={meal}>{capitalize(meal)}</h5>
                                ))
                                : <h5>None</h5>}
                            </div>

                            <div className='recipe-box-url'>
                                <h3>URL</h3>
                                {this.state.recipe.url ?
                                <OutsideAnchor href={this.state.recipe.url} className='recipe-box-url-anchor'>{this.state.recipe.url}</OutsideAnchor>
                                :
                                <span>None</span>}
                            </div>

                            <hr />

                            <h3>Ingredients</h3>
                            
                            {/* Added hovering effect for add all ingredients button */}
                            {this.state.groceryAnimation && 
                                <div className='recipe-box-grocery-animation-wrapper'>
                                    <span className='recipe-box-grocery-animation' onAnimationEnd={() => this.setState({groceryAnimation: false})}>Added</span>
                                </div>
                            }
                            <button
                                data-tip='Add all ingredients to grocery list'
                                data-for='react-tooltip'
                                data-place='right'
                                className='recipe-box-add-grocery-list-all'
                                onClick={() => {
                                    if (!this.state.groceryAnimation) {
                                        this.state.recipe.ingredients.forEach(ingredient => ipcRenderer.invoke('groceryList:add', ingredient, this.state.recipe.id));
                                        this.setState({groceryAnimation: true})
                                    }
                                }}
                            >
                                <img src={AddToListEmerald} alt='Add to grocery list'/><span>All</span>
                            </button>

                            <div className='recipe-box-ingredients-list'>
                                {this.state.recipe.ingredients.length > 0 ?
                                    ingredients
                                    :
                                    'None'
                                }
                            </div>

                            <h3>Instructions</h3>
                            <p className='recipe-box-instructions'>
                            {recipeInstructions[0].props.children ?
                                recipeInstructions
                                :
                                <span className='recipe-box-instructions-none'>None</span>
                            }</p>

                        </div>
                    )
                }
            </BoxWindow>
        )
    }
}

export default RecipeBox