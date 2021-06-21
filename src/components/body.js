import '../styles/body.css'
import React from 'react'
import RecipeBox from './recipeBox.js'
import CreateBox from './createBox.js'

import AddCircleBlack from '../images/addCircleBlack.png'

function Body({recipes, recipePage, ipcRenderer, refreshRecipes}) {

    const [recipeBoxId, setRecipeBoxId] = React.useState(null)
    const [editBox, setEditBox] = React.useState(null)

    return (
        <div className='MainBody body'>
            {
                recipes && recipes.length === 0 ?
                <div className='center'>
                        <h2>Looks like you don't have any recipes!</h2>
                        <div className='center-image-in-text'>
                            <h3>Click the </h3><img src={AddCircleBlack} alt='Add recipe icon' className='inline-add-circle-icon'/><h3> icon on the top right to add your first recipe.</h3>
                        </div>    
                </div>
                :
                <div>
                    <h1>Your Recipes</h1>
                    <h2>Page {recipePage}</h2>
                    <div className='recipe-preview-list'>
                        {recipes.map(recipe => (
                            <div className='recipe-preview' key={recipe.id} onClick={() => setRecipeBoxId(recipe.id)}>
                                <div className='recipe-preview-image-wrapper'>
                                    <img src={recipe.image} alt=''/>
                                </div>
                                <h2>{recipe.name}</h2>
                            </div>
                        ))}
                    </div>
                </div>
            }


            {
                recipeBoxId && <RecipeBox recipeId={recipeBoxId} ipcRenderer={ipcRenderer} unmount={() => setRecipeBoxId(null)} openEditBox={(initialValue) => setEditBox(initialValue)}/>
            }

            {
                editBox && <CreateBox ipcRenderer={ipcRenderer} initialValue={editBox} unmount={() => setEditBox(null)} openRecipeBox={(recipeBoxId) => setRecipeBoxId(recipeBoxId)} refreshRecipes={refreshRecipes}/>
            }
            
        </div>
    )
}

export default Body