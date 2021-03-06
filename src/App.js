import './App.css'
import 'animate.css/animate.min.css'
import React from 'react'
import { setRecipeImage } from './utils.js'

import RecipeBox from './components/recipeBox.js'
import CreateBox from './components/createBox.js'
import FilterBox from './components/filterBox.js'
import ClickOutside from './components/clickOutside.js'
import ReactTooltip from 'react-tooltip'
import GroceryList from './components/groceryList.js'
import ConfirmationBox from './components/confirmationBox.js'

import AddCircleBlack from './images/addCircleBlack.png'
import LeftEmerald from './images/leftEmerald.png'
import RightEmerald from './images/rightEmerald.png'
import AddCircleEmerald from './images/addCircleEmerald.png'
import ExpandEmerald from './images/expandEmerald.png'
import FilterEmerald from './images/filterEmerald.png'
import GroceryListEmerald from './images/groceryListEmerald.png'


const { ipcRenderer } = window.require('electron')


class App extends React.Component {

    constructor() {
        super()
        this.state = {
            recipes: [],
            recipePage: 1,
            totalPages: 1,
            recipeBoxId: null,
            editBox: null,
            filter: null,
            filterBox: false,
            miniCreateBox: false,
            miniCreateBoxUrl: '',
            createBox: false,
            animateRecipePreviews: true,
            clearAllPrompt: false,
            groceryList: false
        }
        
        this.ipcRenderer = ipcRenderer

        this.setRecipes = this.setRecipes.bind(this)
        this.refreshRecipes = this.refreshRecipes.bind(this)
        this.setRecipePage = this.setRecipePage.bind(this)
        this.setFilter = this.setFilter.bind(this)
        
        this.miniCreateBoxUrlInput = React.createRef()
    }
    
    componentDidMount() {
        this.refreshRecipes()
    }

    setRecipes(recipes) {

        recipes.map(recipe => {
            setRecipeImage(recipe)

            return recipe
        })

        this.setState({recipes})
    }

    refreshRecipes() {
        this.ipcRenderer.invoke('recipes:readPage', this.state.recipePage, this.state.filter).then(recipes => {
            this.setRecipes(recipes)
        })

        this.ipcRenderer.invoke('recipes:getTotalPages', this.state.filter).then(totalPages => {
            this.setState({totalPages})
        })
    }

    setRecipePage(newPage) {
        this.setState({recipePage: newPage}, this.refreshRecipes)
    }

    setFilter(filter) {
        this.setState({recipePage: 1, filter}, this.refreshRecipes)

        if (filter !== this.state.filter) {
            this.setState({animateRecipePreviews: true})
        }
    }

    render() {

        const leftDisabled = this.state.recipePage === 1
        const rightDisabled = this.state.recipePage === this.state.totalPages

        const pageArrows = (
            <div className='body-page-wrapper'>
                <button className={leftDisabled ? 'disabled-input' : ''}>
                    <img src={LeftEmerald} onClick={() => !leftDisabled && this.setRecipePage(this.state.recipePage - 1)} alt='previous page'/>
                </button>
                <button className={rightDisabled ? 'disabled-input' : ''}>
                    <img src={RightEmerald} onClick={() => !rightDisabled && this.setRecipePage(this.state.recipePage + 1)} alt='next page'/>
                </button>
            </div>
        )
        
        return (
            <div className='App'>
                
                <ReactTooltip id='react-tooltip' delayShow={500} effect='solid'/>

                <div className='Header'>
                    <div className='header-buttons-wrapper'>
                        <div className='filter-button-wrapper'>
                            <button className='filter-button' data-tip='Search Filter' onClick={() => {
                                this.setState({filterBox: this.state.filterBox ? false : true})
                                this.setFilter(null)
                            }}>
                                <img src={FilterEmerald} alt='Filter recipes'/>
                            </button>
                        </div>
                        <div className='grocery-list-button-wrapper'>
                            <button data-tip='Grocery List' onClick={() => {
                                this.setState({groceryList: true})
                            }}>
                                <img src={GroceryListEmerald} alt='Grocery List' />
                            </button>
                        </div>
                        <div className='recipe-manage-buttons-wrapper'>
                            <button className='clear-all-button' onClick={() => {
                                this.setState({clearAllPrompt: true})
                            }}>Clear all recipes</button>
                            <button className='add-recipe-button' data-tip='Add Recipe' onClick={() => {

                                if (this.state.miniCreateBox) {
                                    this.miniCreateBoxUrlInput.current.blur()
                                } else {
                                    this.miniCreateBoxUrlInput.current.focus()
                                }

                                this.setState({
                                    miniCreateBox: !this.state.miniCreateBox
                                })

                            }}
                            >
                                <img src={AddCircleEmerald} alt='Add a new recipe' />
                            </button>
                        </div>
                    </div>

                    {/* mini create box */}
                    <ClickOutside onClick={() => this.setState({miniCreateBox: false})}>
                        <div className={`mini-create-box ${this.state.miniCreateBox ? '' : 'hidden'}`}>
                            <h1 className='mini-create-box-title'>Enter URL</h1>
                            <input className='mini-create-box-url-input' type='text' value={this.state.miniCreateBoxUrl} placeholder='Paste URL...' ref={this.miniCreateBoxUrlInput}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        this.setState({
                                            createBox: {sendRequest: true, url: this.state.miniCreateBoxUrl},
                                            miniCreateBox: false,
                                            miniCreateBoxUrl: ''
                                        })
                                    }
                                }}
                                onChange={(event) => {
                                    this.setState({
                                        miniCreateBoxUrl: event.target.value
                                    })
                                }}
                            />
                            <button className='mini-create-box-expand-wrapper'>
                                <img className='mini-create-box-expand' data-tip='Expand' data-offset="{'left': -15}" data-place='left' src={ExpandEmerald} alt='Expand' onClick={() => {
                                    this.setState({
                                        createBox: {sendRequest: false, url: this.state.miniCreateBoxUrl},
                                        miniCreateBoxUrl: '',
                                        miniCreateBox: false
                                    })
                                }}/>
                            </button>
                        </div>
                    </ClickOutside>

                    {/* delete prompt */}
                    {
                        this.state.clearAllPrompt &&
                        <ConfirmationBox
                            onCancel={() => null}
                            onConfirm={() => this.ipcRenderer.invoke('recipes:clear').then(this.refreshRecipes)}
                            unmount={() => this.setState({clearAllPrompt: false})}
                            promptText='Clear all recipes?'
                            warningText='Warning: This action cannot be undone'
                            cancelButtonText='Cancel'
                            confirmButtonText='Clear'
                        />
                    }

                    {/* filter */}
                    {this.state.filterBox && <FilterBox setFilter={this.setFilter}/>}
        
        
                    {/* large create box */}
                    {
                        this.state.createBox &&
                        <CreateBox unmount={() => this.setState({createBox: false})} refreshRecipes={this.refreshRecipes} initialValue={this.state.createBox}/>
                    }
        
                </div>

                <div className='MainBody body'>
                    {
                        this.state.recipes && this.state.recipes.length === 0 ?

                        !this.state.filter ?
                        <div className='center'>
                            <h2>Looks like you don't have any recipes</h2>
                            <div className='center-image-in-text'>
                                <h3>Click the </h3><img src={AddCircleBlack} alt='Add recipe icon' className='inline-add-circle-icon'/><h3> icon on the top right to add your first recipe.</h3>
                            </div>
                        </div>
                        :
                        <div className='recipe-no-results'>
                            <h2>Someone's gotten too picky</h2>
                            <h3>No results match your filters.</h3>
                        </div>

                        :
                        <div>
                            <h1>Your recipes</h1>
                            <h2>Page {this.state.recipePage}/{this.state.totalPages}</h2>
                            {pageArrows}
                            <div className='recipe-preview-list'>
                                {this.state.recipes.map(recipe => (
                                    <div className={`recipe-preview ${this.state.animateRecipePreviews ? 'animate__animated animate__fadeIn animate__faster' : ''}`} onAnimationEnd={() => this.setState({animateRecipePreviews: false})} key={recipe.id} onClick={() => this.setState({recipeBoxId: recipe.id})} recipe=''>
                                        <div className='recipe-preview-image-wrapper'>
                                            <img src={recipe.image} alt=''/>
                                        </div>
                                        <h2>{recipe.name}</h2>
                                    </div>
                                ))}
                            </div>
                            {pageArrows}
                        </div>
                    }


                    {
                        this.state.recipeBoxId && <RecipeBox recipeId={this.state.recipeBoxId} unmount={() => this.setState({recipeBoxId: null})} openEditBox={(initialValue) => this.setState({editBox: initialValue})}/>
                    }

                    {
                        this.state.editBox && <CreateBox initialValue={this.state.editBox} unmount={() => this.setState({editBox: null})} openRecipeBox={recipeBoxId => this.setState({recipeBoxId})} refreshRecipes={this.refreshRecipes}/>
                    }

                    {
                        this.state.groceryList && <GroceryList unmount={() => this.setState({groceryList: false})} />
                    }
                    
                </div>
    
            </div>
        )
    }
}

export default App
