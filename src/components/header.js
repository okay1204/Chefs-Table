import '../styles/header.css';
import React from 'react';

import ClickOutside from '../components/clickOutside.js';
import AddCircleEmerald from '../images/addCircleEmerald.png';


function Header({ipcRenderer}) {

    function handleUrlInput(event) {
        if (event.key === 'Enter') {
            ipcRenderer.recipes.webscrape(event.target.value)
            .then((recipeData) => {
                console.log(recipeData);
            })
            .catch((error) => {
                if (error.code === 'DOMAIN_UNSUPPORTED') {
                    setError('Website not supported');
                } else if (error.code === 'DOMAIN_REQUEST_ERROR') {
                    setError('Failed request, is the website down?');
                } else {
                    setError('Invalid recipe URL');
                }
            });
        } else {
            setError(null);
        }
    }

    const [createBox, setCreateBox] = React.useState(false);
    const [error, setError] = React.useState(null);

    return (
        <div className='Header'>
            <div className='add-recipe-button-wrapper'>
                <button className='add-recipe-button' onClick={() => setCreateBox(!createBox)}>
                    <img src={AddCircleEmerald} alt='Add a new recipe' />
                </button>
            </div>

            {
                createBox &&
                <ClickOutside onClick={() => setCreateBox(false)}>
                    <div className='mini-create-box'>
                        <h1 className='mini-create-box-title'>Enter URL</h1>
                        <input className='mini-create-box-url-input' onKeyDown={(event) => handleUrlInput(event)} type='text' autoFocus placeholder='Paste URL...'/>
                        {
                            error &&
                            <span className='mini-create-box-error'>{error}</span>
                        }
                    </div>
                </ClickOutside>
            }
        </div>
    )
};

export default Header;