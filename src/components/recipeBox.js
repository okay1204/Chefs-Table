import '../styles/recipeBox.css'
import 'animate.css/animate.min.css'
import React from 'react'
import { setRecipeImage } from '../utils.js'

import CloseBlack from '../images/closeBlack.png'
import LoadingWheel from '../images/loadingWheel.gif'

class RecipeBox extends React.Component {

    constructor() {
        super()
        
        this.state = {
            openAnimating: true,
            closeAnimating: false,
            recipe: null,
            loading: true,
        }
    }
    
    componentDidMount() {
        this.props.ipcRenderer.invoke('recipes:readRecipe', this.props.recipeId)
        .then((recipe) => this.setState({ recipe: setRecipeImage(recipe), loading: false }))
    }
    
    render() {

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
                                <h1>{this.state.recipe.name}</h1>

                                {/* eslint-disable-next-line */}
                                <img src={this.state.recipe.image} alt='recipe image'/>

                                <div className='recipe-box-url'>
                                    <h3>URL</h3>
                                    <p>{this.state.recipe.url ? this.state.recipe.url : 'None'}</p>
                                </div>
                            </div>
                        )
                    }

                </div>
            </div>
        )
    }
}

export default RecipeBox