import '../styles/body.css'
import React from 'react'
import RecipeBox from './recipeBox.js'

import AddCircleBlack from '../images/addCircleBlack.png'

function Body({recipes, recipePage, ipcRenderer}) {

    const [recipeBoxId, setRecipeBoxId] = React.useState(null)

    return (
        <div className='MainBody body'>
            {
                recipes && recipes.length === 0 && 
                <div className='center'>
                        <h2>Looks like you don't have any recipes!</h2>
                        <div className='center-image-in-text'>
                            <h3>Click the </h3><img src={AddCircleBlack} alt='Add recipe icon' className='inline-add-circle-icon'/><h3> icon on the top right to add your first recipe.</h3>
                        </div>    
                </div>
            }

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

            {
                recipeBoxId && <RecipeBox recipeId={recipeBoxId} ipcRenderer={ipcRenderer} unmount={() => setRecipeBoxId(null)}/>
            }
            
        </div>
    )
}

export default Body