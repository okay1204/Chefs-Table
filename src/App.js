import './App.css'
import React from 'react'
import { setRecipeImage } from './utils.js'

import Header from './components/header.js'
import Body from './components/body.js'

const { ipcRenderer } = window.require('electron')


class App extends React.Component {

    constructor() {
        super()
        this.state = {
            recipes: [],
            recipePage: 1,
            totalPages: 1
        }

        this.ipcRenderer = ipcRenderer

        this.setRecipes = this.setRecipes.bind(this)
        this.refreshRecipes = this.refreshRecipes.bind(this)
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

    componentDidMount() {
        this.refreshRecipes()
    }

    render() {
        return (
            <div className='App'>

                <Header
                    refreshRecipes={this.refreshRecipes}
                    ipcRenderer={this.ipcRenderer}
                />

                <Body
                    recipes={this.state.recipes}
                    recipePage={this.state.recipePage}
                    setRecipePage={(newPage) => this.setState({recipePage: newPage}, this.refreshRecipes)}
                    refreshRecipes={this.refreshRecipes}
                    ipcRenderer={this.ipcRenderer}
                    totalPages={this.state.totalPages}
                />
    
            </div>
        )
    }
}

export default App
