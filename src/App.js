import './App.css'
import React from 'react'

import Header from './components/header.js'
import Body from './components/body.js'

const { ipcRenderer } = window.require('electron')


class App extends React.Component {

    constructor() {
        super()
        this.state = {
            recipes: [],
            recipePage: 1
        }

        this.ipcRenderer = ipcRenderer

        this.setRecipes = this.setRecipes.bind(this)
        this.refreshRecipes = this.refreshRecipes.bind(this)
    }

    setRecipes(recipes) {

        recipes.map(recipe => {
            if (typeof recipe.image !== 'string') {
                recipe.image = URL.createObjectURL(new Blob([recipe.image]))
            }

            return recipe
        })

        console.log(recipes)

        this.setState({recipes})
    }

    refreshRecipes() {
        this.setState({recipePage: 1})

        this.ipcRenderer.invoke('recipes:readPage', 1).then((recipes) => {
            this.setRecipes(recipes)
        })
    }

    componentDidMount() {
        this.ipcRenderer.invoke('recipes:readPage', this.state.recipePage).then((recipes) => {
            this.setRecipes(recipes)
        })
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
                    refreshRecipes={this.refreshRecipes}
                    ipcRenderer={this.ipcRenderer}
                />
    
            </div>
        )
    }
}

export default App
