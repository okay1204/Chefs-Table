import '../styles/createBox.css';
import 'animate.css/animate.min.css'
import React from 'react';
import OutsideAnchor from './outSideAnchor';

import CloseBlack from '../images/closeBlack.png';
import LoadingWheel from '../images/loadingWheel.gif';
import DeleteIcon from '../images/delete.png';
import CloseRed from '../images/closeRed.png';

class CreateBox extends React.Component {

    constructor() {
        super();
        
        this.meals = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other'];
        const mealObj = {};
        this.meals.forEach((meal) => mealObj[meal] = false);
        
        this.state = {
            animation: null,
            urlError: null,
            url: '',
            urlLoading: false,
            websiteList: false,
            inputImage: '',
            imageError: null,
            image: {},
            imageLoading: false,
            inputName: '',
            inputProtein: '',
            inputMeal: mealObj,
            inputInstructions: '',
            inputIngredients: {},
            ingredientIdCount: 0
        };
        
        this.handleUrlInput = this.handleUrlInput.bind(this);
        this.addIngredient = this.addIngredient.bind(this);
        this.getImage = this.getImage.bind(this);     
    }
    
    componentDidMount() {
        const initialValue = this.props.initialValue;

        if (initialValue) {
            this.setState({url: initialValue.url})
            if (initialValue.sendRequest) {
                this.handleUrlInput(initialValue.url);
            }
        }

    }
    
    handleUrlInput(url) {
        if (!url) return;

        this.setState({urlLoading: true})

        this.props.ipcRenderer.recipes.webscrape(url)
        .then((recipeData) => {

            this.setState({
                inputIngredients: {},
                ingredientIdCount: 0
            })
            recipeData.ingredients.forEach((ingredient) => {
                this.addIngredient(ingredient);
            })

            this.setState({
                image: recipeData.imageUrl ? {
                    type: 'url',
                    data: recipeData.imageUrl
                }
                : {},
                inputImage: recipeData.imageUrl ? recipeData.imageUrl : '',
                inputName: recipeData.name,
                inputProtein: recipeData.protein ? recipeData.protein : '',
                inputInstructions: recipeData.instructions
            })
        })
        .catch((error) => {
            let urlError;
            if (error.code === 'DOMAIN_UNSUPPORTED') {
                urlError = 'Website not supported';
            } else if (error.code === 'DOMAIN_REQUEST_ERROR') {
                urlError = 'Failed request, is the URL correct?';
            } else {
                urlError = 'Invalid recipe URL';
            }

            this.setState({urlError})
        })
        .finally(() => {
            this.setState({urlLoading: false})
        });
    }

    addIngredient(ingredient) {
        const newIngredients = this.state.inputIngredients;
        newIngredients[this.state.ingredientIdCount] = ingredient;

        this.setState({
            ingredientIdCount: this.state.ingredientIdCount + 1,
            inputIngredients: newIngredients
        });
    }

    getImage(url) {

        this.setState({imageLoading: true});

        this.props.ipcRenderer.invoke('main:isImageUrl', url)
        .then(result => {
            if (result.isImage) {
                this.setState({
                    image: { type: 'url', data: url }
                });
            } else {
                let imageError;
                if (result.code === 'REQUEST_FAILED') {
                    imageError = 'Failed request, is the URL correct?';
                } else if (result.code === 'NOT_IMAGE_URL') {
                    imageError = 'URL is not a direct image link';
                } else if (result.code === 'UNSUPPORTED_TYPE') {
                    imageError = 'Only png, jpg, jpeg, and webp image formats are supported';
                }
                
                this.setState({imageError})
            }

            this.setState({imageLoading: false});
        })
    }

    render() {

        const ingredientsHTML = [];

        for (const key of Object.keys(this.state.inputIngredients)) {
            ingredientsHTML.push([
                <div key={'delete ' + key} className='create-box-ingredients-delete'><img src={DeleteIcon} alt='delete' onClick={() => {
                    const newIngredients = this.state.inputIngredients;
                    delete newIngredients[key];

                    this.setState({
                        inputIngredients: newIngredients
                    });
                }}/></div>,
                <input key={'input ' + key} type='text' placeholder='Recipe ingredient...' value={this.state.inputIngredients[key]} onChange={(event) => {

                    const newIngredients = JSON.parse(JSON.stringify(this.state.inputIngredients));
                    newIngredients[key] = event.target.value;
                    
                    this.setState({
                        inputIngredients: newIngredients
                    });
                }}/>
            ])
        }


        return (
            <div className='create-box-wrapper'>
                {
                    !this.state.animation && 
                    <div className='create-box-background'><wbr /></div>
                }

                <div className={`create-box ${this.state.animation ? this.state.animation : ''}`} onAnimationEnd={() => {
                    if (this.state.animation) {
                        this.props.unmount();
                    }
                }}>

                    <img className='create-box-close' src={CloseBlack} alt='close' onClick={() => this.setState({animation: 'create-box-animate-out'})}/>
                    <h1>Add Recipe</h1>

                    <div className='create-box-url-input-wrapper'>
                        <label htmlFor='url'>URL</label>
                        <input className='create-box-url-input' type='text' id='url' name='url' placeholder='Paste URL... (optional)' defaultValue={this.state.url} onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                this.handleUrlInput(event.target.value);
                            } else {
                                this.setState({urlError: null});
                            }

                        }}
                        onChange={(event) => {
                            this.setState({url: event.target.value});
                        }}/>
                        {this.state.urlLoading && <img className='create-box-url-loading-wheel' src={LoadingWheel} alt='loading'/>}
                        <button className='create-box-autofill-button' onClick={() => {
                            this.handleUrlInput(this.state.url);
                            this.setState({urlError: null});
                        }}>Autofill</button>
                    </div>

                    {this.state.urlError && <span className='create-box-url-error'>{this.state.urlError}</span>}

                    <span className='create-box-supported-websites-button' onClick={() => this.setState({websiteList: !this.state.websiteList})}>{this.state.websiteList ? 'Hide' : 'See list of supported websites'}</span>
                    <ul className='create-box-supported-websites-list'>
                        {   
                            this.state.websiteList &&
                            ['cooking.nytimes.com', 'www.allrecipes.com']
                            .map((website) => {
                                const domain = 'https://' + website;

                                return (
                                    <OutsideAnchor
                                        key={website}
                                        ipcRenderer={this.props.ipcRenderer}
                                        href={domain}
                                        onClick={() => this.props.ipcRenderer.send('main:loadGH', domain)}
                                    >
                                        {website}
                                    </OutsideAnchor>
                                )
                            })
                        }
                    </ul>

                    <hr />

                    <h3>Image</h3>
                    <div className='create-box-image-select'>
                        <button onClick={() => {
                            this.props.ipcRenderer.invoke('main:readImage').then(data => {
                                if (data) {
                                    this.setState({
                                        image: {
                                            type: 'binary',
                                            data
                                        }
                                    })
                                }
                            })
                        }}>Browse your files</button>

                        <span>or</span>

                        <div className='create-box-paste-image-url-wrapper'>
                            <input type='text' placeholder='Image URL..' value={this.state.inputImage} onChange={(event) => {              
                                this.setState({inputImage: event.target.value});
                            }} onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    this.getImage(event.target.value);
                                } else {
                                    this.setState({imageError: null});
                                }
                            }}/>

                            {this.state.imageLoading && <img className='create-box-image-loading-wheel' src={LoadingWheel} alt='loading'/>}

                            <button onClick={() => {
                                this.getImage(this.state.inputImage);
                                this.setState({imageError: null});
                            }}>Grab Image</button>
                        </div>
                    </div>
                    {this.state.imageError && <span className='create-box-image-error'>{this.state.imageError}</span>}

                    {   
                        this.state.image.type &&
                        <div className='create-box-image-wrapper'>
                            <div className='create-box-image-delete-wrapper'>
                                {/* eslint-disable-next-line */}
                                <img src={CloseRed} alt='Delete recipe image' onClick={() => this.setState({image: {}})}/>
                            </div>
                            <img className='create-box-image'
                                src={
                                    this.state.image.type === 'url' ?
                                    this.state.image.data
                                    : // decode image from binary
                                    URL.createObjectURL(new Blob([this.state.image.data]))
                                }
                            alt='' />
                        </div>
                    }

                    <div className='create-box-input-grid'>
                        <label htmlFor='create-box-name'>Name</label>
                        <input type='text' id='create-box-name' name='name' placeholder='Recipe Name...' value={this.state.inputName} onChange={(event) => {
                            this.setState({inputName: event.target.value});
                        }}/>

                        <label htmlFor='create-box-protein'>Protein</label>
                        <input type='text' name='create-box-protein' placeholder='Main Protein... (leave blank if none)' value={this.state.inputProtein} onChange={(event) => {
                            this.setState({inputProtein: event.target.value});
                        }}/>
                    </div>

                    <h3>Meal</h3>
                    
                    <div className='create-box-meal-wrapper'>
                        {
                            this.meals
                            .map((meal) => (
                                <div className='create-box-checkbox-wrapper' key={meal}>
                                    <input type='checkbox' id={`create-box-${meal}`} name={meal} onChange={(event) => {
                                        const newMeal = this.state.inputMeal;
                                        newMeal[meal] = event.target.checked;
                                        
                                        this.setState({inputMeal: newMeal});
                                    }}/>
                                    <label htmlFor={`create-box-${meal}`}>{meal[0].toUpperCase() + meal.substring(1).toLowerCase()}</label>
                                </div>
                            ))
                        }
                    </div>

                    <h3>Instructions</h3>
                    <textarea className='create-box-instructions' placeholder='Recipe Instructions...' value={this.state.inputInstructions} onChange={(event) => this.setState({inputInstructions: event.target.value})}/>

                    <h3>Ingredients</h3>
                    <ul className='create-box-ingredients-list'>
                        {ingredientsHTML}
                    </ul>
                    <button className='create-box-add-ingredient' onClick={() => this.addIngredient('')}>+</button>

                </div>
            </div>
        )
    };
}

export default CreateBox;