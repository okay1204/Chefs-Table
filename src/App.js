import './App.css';
import React from 'react';

import Header from './components/header.js';
import Body from './components/body.js'

import ipcRendererStateManager from './ipcRendererStateManager.js';

const { ipcRenderer: rawIpcRenderer } = window.require('electron');

function App() {

    const [recipes, setRecipes] = React.useState([]);
    const ipcRenderer = ipcRendererStateManager;
    ipcRenderer.initialize(rawIpcRenderer, setRecipes);

    // initial reading of db
    React.useEffect(() => {
        ipcRenderer.invoke('recipes:read').then((recipes) => {
            setRecipes(recipes);
        })
    })



    return (
        <div className='App'>

            <Header ipcRenderer={ipcRenderer}/>
            <Body recipes={recipes} ipcRenderer={ipcRenderer}/>

        </div>
    );
}

export default App;
