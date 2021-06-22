import './App.css'
import 'animate.css/animate.min.css'
import React from 'react'
import { setRecipeImage } from './utils.js'

import RecipeBox from './components/recipeBox.js'
import CreateBox from './components/createBox.js'
import ClickOutside from './components/clickOutside.js'

import AddCircleBlack from './images/addCircleBlack.png'
import LeftEmerald from './images/leftEmerald.png'
import RightEmerald from './images/rightEmerald.png'
import AddCircleEmerald from './images/addCircleEmerald.png'
import ExpandEmerald from './images/expandEmerald.png'


const { ipcRenderer } = window.require('electron')


class App extends React.Component {

    constructor() {
        super()
        this.state = {
            recipes: [],
            recipePage: 1,
            totalPages: 1,
            recipeBoxId: null,
            editBox: null
        }

        this.ipcRenderer = ipcRenderer

        this.setRecipes = this.setRecipes.bind(this)
        this.refreshRecipes = this.refreshRecipes.bind(this)
        this.setRecipePage = this.setRecipePage.bind(this)

        this.miniCreateBoxUrlInput = React.createRef()
    }

    setRecipes(recipes) {

        recipes.map(recipe => {
            setRecipeImage(recipe)

            return recipe
        })

        this.setState({recipes})
    }

    refreshRecipes() {
        this.ipcRenderer.invoke('recipes:readPage', this.state.recipePage).then(recipes => {
            this.setRecipes(recipes)
        })

        this.ipcRenderer.invoke('recipes:getTotalPages', this.state.recipePage).then(totalPages => {
            this.setState({totalPages})
        })
    }

    setRecipePage(newPage) {
        this.setState({recipePage: newPage}, this.refreshRecipes)
    }

    componentDidMount() {
        this.refreshRecipes()
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

                <div className='Header'>
                    <div className='add-recipe-button-wrapper'>
                        <button className='add-recipe-button' onClick={() => {

                            if (this.state.miniCreateBox) {
                                this.miniCreateBoxUrlInput.current.blur()
                            } else {
                                this.miniCreateBoxUrlInput.current.focus()
                            }

                            this.setState({
                                miniCreateBox: !this.state.miniCreateBox
                            })

                        }}>
                            <img src={AddCircleEmerald} alt='Add a new recipe' />
                        </button>
                    </div>
        
                    {/* mini create box with url input only */}
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
                                <img className='mini-create-box-expand' src={ExpandEmerald} alt='Expand' onClick={() => {
                                    this.setState({
                                        createBox: {sendRequest: false, url: this.state.miniCreateBoxUrl},
                                        miniCreateBoxUrl: '',
                                        miniCreateBox: false
                                    })
                                }}/>
                            </button>
                        </div>
                    </ClickOutside>
        
                    {/* large create box */}
                    {
                        this.state.createBox &&
                        <CreateBox unmount={() => this.setState({createBox: false})} refreshRecipes={this.refreshRecipes} ipcRenderer={this.ipcRenderer} initialValue={this.state.createBox}/>
                    }
        
                </div>

                <div className='MainBody body'>
                    {
                        this.state.recipes && this.state.recipes.length === 0 ?
                        <div className='center'>
                                <h2>Looks like you don't have any recipes!</h2>
                                <div className='center-image-in-text'>
                                    <h3>Click the </h3><img src={AddCircleBlack} alt='Add recipe icon' className='inline-add-circle-icon'/><h3> icon on the top right to add your first recipe.</h3>
                                </div>
                        </div>
                        :
                        <div>
                            <h1>Your recipes</h1>
                            <h2>Page {this.state.recipePage}/{this.state.totalPages}</h2>
                            {pageArrows}
                            <div className='recipe-preview-list'>
                                {this.state.recipes.map(recipe => (
                                    <div className='recipe-preview' key={recipe.id} onClick={() => this.setState({recipeBoxId: recipe.id})}>
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
                        this.state.recipeBoxId && <RecipeBox recipeId={this.state.recipeBoxId} ipcRenderer={this.ipcRenderer} unmount={() => this.setState({recipeBoxId: null})} openEditBox={(initialValue) => this.setState({editBox: initialValue})}/>
                    }

                    {
                        this.state.editBox && <CreateBox ipcRenderer={ipcRenderer} initialValue={this.state.editBox} unmount={() => this.setState({editBox: null})} openRecipeBox={(recipeBoxId) => this.setState({editBox: recipeBoxId})} refreshRecipes={this.refreshRecipes}/>
                    }
                    
                </div>
    
            </div>
        )
    }
}

export default App
