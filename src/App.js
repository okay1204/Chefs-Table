import './App.css';
import React from 'react';

import Header from './components/header.js';
import Body from './components/body.js'

import ipcRendererStateManager from './ipcRendererStateManager.js';

const { ipcRenderer: rawIpcRenderer } = window.require('electron');


class App extends React.Component {

    constructor() {
        super();
        this.state = {
            recipes: [],
        };

        this.ipcRenderer = ipcRendererStateManager;
        this.ipcRenderer.initialize(rawIpcRenderer, (newRecipes) => this.setState({recipes: newRecipes}));

        this.setCreateBox = this.setCreateBox.bind(this)
    }

    setCreateBox(value) {
        this.setState({createBox: value});
    }

    componentDidMount() {
        this.ipcRenderer.invoke('recipes:read').then((recipes) => {
            this.setState({recipes});
        });
    }

    render() {
        return (
            <div className='App'>

                <Header
                    ipcRenderer={this.ipcRenderer}
                />

                <Body
                    recipes={this.state.recipes}
                    ipcRenderer={this.ipcRenderer}
                />
    
            </div>
        );
    }
}

export default App;
