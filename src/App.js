import './App.css';
import React from 'react';

import Header from './components/header.js';
import Body from './components/body.js'

import ipcRendererStateManager from './ipcRendererStateManager.js';

const { ipcRenderer: rawIpcRenderer } = window.require('electron');

function App() {

    const [recipes, setRecipes] = React.useState(null);
    const ipcRenderer = new ipcRendererStateManager(rawIpcRenderer, setRecipes);

    // initial reading of json
    ipcRenderer.raw.invoke('recipes:read').then((recipes) => {
        setRecipes(JSON.stringify(recipes));
    })

    return (
        <div className='App'>

            <Header/>
            <Body recipes={recipes} setRecipes={setRecipes} ipcRenderer={ipcRenderer}/>

        </div>
    );
}

export default App;
