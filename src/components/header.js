import '../styles/header.css';
import React from 'react';

import ClickOutside from '../components/clickOutside.js';
import AddCircle from '../images/addCircle.png';

import WebScrape from '../webscrape.js';

function Header({ipcRenderer}) {

    function addRecipe(event) {
        if (event.key === 'Enter') {
            WebScrape.getRecipeData(event.target.value)
            .then((recipeData) => {
                console.log(recipeData);
            })
            .catch((error) => {
                console.log(error.code)
                if (error.code === 'DOMAIN_UNSUPPORTED') {
                    console.log('domain unsupported');
                } else {
                    console.log('something went wrong');
                }
            });
        };
    }

    const [createBox, setCreateBox] = React.useState(false);

    return (
        <div className='Header'>
            <div className='add-recipe-button-wrapper'>
                <button className='add-recipe-button' onClick={() => setCreateBox(!createBox)}>
                    <img src={AddCircle} alt='Add a new recipe' />
                </button>
            </div>

            {
                createBox &&
                <ClickOutside onClick={() => setCreateBox(false)}>
                    <div className='create-box'>
                        <h1 className='create-box-title'>Enter URL</h1>
                        <input className='create-box-url-input' onKeyDown={(event) => {addRecipe(event)}} type='text' placeholder='Paste URL...'/>
                    </div>
                </ClickOutside>
            }
        </div>
    )
};

export default Header;