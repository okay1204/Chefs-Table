import '../styles/recipeBox.css'
import 'animate.css/animate.min.css'
import React from 'react'
import { setRecipeImage, capitalize } from '../utils.js'
import OutsideAnchor from '../components/outSideAnchor.js'

import CloseBlack from '../images/closeBlack.png'
import LoadingWheel from '../images/loadingWheel.gif'
import EditBlack from '../images/editBlack.png'

class RecipeBox extends React.Component {

    constructor() {
        super()
        
        this.state = {
            openAnimating: true,
            closeAnimating: false,
            recipe: null,
            rawImage: null,
            loading: true
        }
    }

    // set body overflow to prevent scrolling outside of the component
    componentWillUnmount() {
        document.body.style.overflow = 'unset'
    }
    
    componentDidMount() {
        document.body.style.overflow = 'hidden'
        this.props.ipcRenderer.invoke('recipes:readRecipe', this.props.recipeId)
        .then((recipe) => {
            const rawImage = recipe.image
            this.setState({ recipe: setRecipeImage(recipe), rawImage, loading: false })
        })
    }
    
    render() {

        let ingredients
        // replace all \n in text to line break tags
        let recipeInstructions
        
        if (!this.state.loading) {

            let ingredientIdCount = 0
            ingredients = this.state.recipe.ingredients.map(step => {
                const ingredientId = ingredientIdCount++
                const checkboxClassname = 'recipe-box-ingredient-checkbox-' + ingredientId
                return (
                    <div key={ingredientId}>
                        <input type='checkbox' id={checkboxClassname}/>
                        <label htmlFor={checkboxClassname}>{step}</label>
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

            <div className='recipe-box-wrapper'>
                {
                    !this.state.closeAnimating && 
                    <div className='recipe-box-background'><wbr /></div>
                }

                <div className={`recipe-box ${this.state.closeAnimating ? 'recipe-box-animate-out' : ''}`} onAnimationEnd={() => {
                    if (this.state.closeAnimating) {
                        if (this.state.refreshRecipes) {
                            this.props.refreshRecipes()
                        }

                        this.props.unmount()
                    } else {
                        this.setState({ openAnimating: false })
                    }
                }}>

                {!this.state.openAnimating && <img className='recipe-box-close' src={CloseBlack} alt='close' onClick={() => this.setState({closeAnimating: true})}/>}
                
                    {
                        this.state.loading
                        ? <div className='recipe-box-loading'><img src={LoadingWheel} alt='loading' /></div>
                        : (
                            <div className='recipe-box-content-wrapper'>
                                
                                {!this.state.openAnimating && <img className='recipe-box-edit' src={EditBlack} alt='edit' onClick={() => {
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
                                }} />}

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
                                    <OutsideAnchor ipcRenderer={this.props.ipcRenderer} href={this.state.recipe.url} className='recipe-box-url-anchor'>{this.state.recipe.url}</OutsideAnchor>
                                    :
                                    <span>None</span>}
                                </div>

                                <hr />

                                <h3>Ingredients</h3>
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

                </div>
            </div>
        )
    }
}

export default RecipeBox