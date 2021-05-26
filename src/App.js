import './App.css';
import React from 'react'
const { ipcRenderer } = window.require('electron');


function App() {
    
    const [recipes, setRecipes] = React.useState(null)

    // initial reading of json
    ipcRenderer.invoke('recipes:read').then((recipes) => {
        setRecipes(JSON.stringify(recipes));
    })

    return (
        <div className='App body'>
            <h1 className='recipes-title'>Recipes</h1>

            <span style={{color: 'white'}}>{recipes}</span>
            <br />

            <button onClick={() => {
                ipcRenderer.invoke('recipes:add', {id: 1, name: 'Some good pasta'}).then((recipes) => setRecipes(JSON.stringify(recipes)))
            }}>add</button>
            <button onClick={() => {
                ipcRenderer.invoke('recipes:remove', 'd9690108-d917-4e29-a4bf-0f000de9d453').then((recipes) => setRecipes(JSON.stringify(recipes)))
            }}>remove</button>
            <button onClick={() => {
                ipcRenderer.invoke('recipes:clear').then((recipes) => setRecipes(JSON.stringify(recipes)))
            }}>clear</button>

        </div>
    );
}

export default App;
