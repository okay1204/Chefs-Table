import '../styles/createBox.css'
import 'animate.css/animate.min.css'
import React from 'react'
import OutsideAnchor from './outSideAnchor.js'
import { capitalize } from '../utils.js'

import CloseBlack from '../images/closeBlack.png'
import LoadingWheel from '../images/loadingWheel.gif'
import DeleteIcon from '../images/delete.png'
import CloseRed from '../images/closeRed.png'
import BackBlack from '../images/backBlack.png'

class CreateBox extends React.Component {

    constructor() {
        super()
        
        this.meals = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other']
        const mealObj = {}
        this.meals.forEach((meal) => mealObj[meal] = false)
        
        this.state = {
            openAnimating: true,
            closeAnimating: false,
            refreshRecipes: false,
            edit: null,
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
            inputHours: 0,
            inputMinutes: 0,
            inputServings: 0,
            inputMeal: mealObj,
            inputInstructions: '',
            inputIngredients: {},
            ingredientIdCount: 0,
            submitLoading: false,
            deletePrompt: false
        }
        
        this.handleUrlInput = this.handleUrlInput.bind(this)
        this.addIngredient = this.addIngredient.bind(this)
        this.getImage = this.getImage.bind(this)   
        this.submitRecipe = this.submitRecipe.bind(this)

        this.openRecipeBox = () => {
            this.props.unmount()
            this.props.openRecipeBox(this.state.edit)
        }
    }


    // set body overflow to prevent scrolling outside of the component
    componentWillUnmount() {
        document.body.style.overflow = 'unset'
    }
    
    componentDidMount() {
        document.body.style.overflow = 'hidden'

        const initialValue = this.props.initialValue

        if (initialValue) {
            this.setState({url: initialValue.url})

            if (initialValue.sendRequest) {
                this.handleUrlInput(initialValue.url)
            } else if (initialValue.edit) {

                const mealObj = {}
                this.meals.forEach((meal) => mealObj[meal] = initialValue.meals.includes(meal))


                const newIngredients = {}
                let ingredientIdCount = this.state.ingredientIdCount
                
                initialValue.ingredients.forEach(ingredient => {
                    newIngredients[ingredientIdCount++] = ingredient
                })

                this.setState({
                    inputIngredients: newIngredients,
                    ingredientIdCount
                })

                this.setState({
                    edit: initialValue.edit,
                    image: initialValue.image.type !== 'none' ? initialValue.image : {},
                    inputImage: initialValue.image.type === 'url' ? initialValue.image.data : '',
                    inputInstructions: initialValue.instructions,
                    inputName: initialValue.name,
                    inputProtein: initialValue.protein ? initialValue.protein : '',
                    inputServings: initialValue.servings,
                    inputHours: Math.floor(initialValue.totalMinutes / 60),
                    inputMinutes: initialValue.totalMinutes % 60,
                    inputMeal: mealObj
                })

            }
        }
    }
    
    handleUrlInput(url) {
        if (!url) return

        this.setState({urlLoading: true})

        this.props.ipcRenderer.invoke('recipes:webscrape', url)
        .then(({error, data: recipeData}) => {
            if (error) throw error

            this.setState({
                inputIngredients: {},
                ingredientIdCount: 0
            })

            recipeData.ingredients.forEach((ingredient) => {
                this.addIngredient(ingredient)
            })

            this.setState({
                urlError: false,
                image: recipeData.imageUrl ? {
                    type: 'url',
                    data: recipeData.imageUrl
                }
                : {},
                inputImage: recipeData.imageUrl ? recipeData.imageUrl : '',
                inputName: recipeData.name,
                inputProtein: recipeData.protein ? recipeData.protein : '',
                inputInstructions: recipeData.instructions,
                inputHours: recipeData.hours,
                inputMinutes: recipeData.minutes,
                inputServings: recipeData.servings
            })
        })
        .catch((error) => {
            let urlError

            switch (error.code) {
                case 'DOMAIN_UNSUPPORTED':
                    urlError = 'Website not supported'
                    break
                case 'DOMAIN_REQUEST_ERROR':
                    urlError = 'Failed request, is the URL correct?'
                    break
                default:
                    urlError = 'Invalid recipe URL' 
                    break
            }

            this.setState({urlError})
        })
        .finally(() => {
            this.setState({urlLoading: false})
        })
    }

    addIngredient(ingredient) {
        const newIngredients = this.state.inputIngredients
        newIngredients[this.state.ingredientIdCount] = ingredient

        this.setState({
            ingredientIdCount: this.state.ingredientIdCount + 1,
            inputIngredients: newIngredients
        })
    }

    getImage(url) {

        if (!url) return

        this.setState({imageLoading: true})

        this.props.ipcRenderer.invoke('main:isImageUrl', url)
        .then(result => {
            if (result.isImage) {
                this.setState({
                    image: { type: 'url', data: url },
                    imageError: false
                })
            } else {
                let imageError

                switch (result.code) {
                    case 'REQUEST_FAILED':
                        imageError = 'Failed request, is the URL correct?'
                        break
                    case 'NOT_IMAGE_URL':
                        imageError = 'URL is not a direct image link'
                        break
                    case 'UNSUPPORTED_TYPE':
                        imageError = 'Only png, jpg, jpeg, and webp image formats are supported'
                        break
                    default:
                        imageError = 'An unknown error occured'
                        break
                }
                
                this.setState({imageError})
            }

            this.setState({imageLoading: false})
        })
    }

    submitRecipe() {


        if (this.state.submitLoading) return

        this.setState({submitLoading: true})

        const url = this.state.url

        const imageType = this.state.image.type
        const image = this.state.image.data

        const name = this.state.inputName ? this.state.inputName : 'Unnamed Recipe'
        const protein = this.state.inputProtein ? this.state.inputProtein : null
        
        const meals = []
        for (const [key, value] of Object.entries(this.state.inputMeal)) {
            if (value) {
                meals.push(key);
            }
        }

        const instructions = this.state.inputInstructions
        
        const ingredients = []
        Object.values(this.state.inputIngredients).forEach(ingredient => ingredients.push(ingredient))

        const totalMinutes = (this.state.inputHours * 60) + this.state.inputMinutes
        
        const servings = this.state.inputServings

        // if adding a recipe
        if (!this.state.edit) {
            this.props.ipcRenderer.invoke('recipes:add', {
                url,
                imageType,
                image,
                name,
                protein,
                meals,
                instructions,
                ingredients,
                totalMinutes,
                servings
            })
    
            this.setState({
                closeAnimating: true,
                refreshRecipes: true
            })
        } else {

            this.props.ipcRenderer.invoke('recipes:edit', {
                id: this.state.edit,
                url,
                imageType,
                image,
                name,
                protein,
                meals,
                instructions,
                ingredients,
                totalMinutes,
                servings
            }).then(this.openRecipeBox)

            this.props.refreshRecipes()
        }
    }

    render() {

        const ingredientsHTML = []

        for (const key of Object.keys(this.state.inputIngredients)) {
            ingredientsHTML.push([
                <div key={'delete ' + key} className='create-box-ingredients-delete'><img src={DeleteIcon} alt='delete' onClick={() => {
                    const newIngredients = this.state.inputIngredients
                    delete newIngredients[key]

                    this.setState({
                        inputIngredients: newIngredients
                    })
                }}/></div>,
                <input key={'input ' + key} type='text' placeholder='Recipe ingredient...' value={this.state.inputIngredients[key]} onChange={(event) => {

                    const newIngredients = JSON.parse(JSON.stringify(this.state.inputIngredients))
                    newIngredients[key] = event.target.value
                    
                    this.setState({
                        inputIngredients: newIngredients
                    })
                }}/>
            ])
        }


        return (
            <div className='create-box-wrapper'>
                {
                    !this.state.closeAnimating && 
                    <div className='create-box-background'><wbr /></div>
                }

                <div className={`create-box ${this.state.closeAnimating ? 'create-box-animate-out' : ''}`} onAnimationEnd={() => {
                    if (this.state.closeAnimating) {
                        if (this.state.refreshRecipes) {
                            this.props.refreshRecipes()
                        }

                        this.props.unmount()
                    } else {
                        this.setState({ openAnimating: false })
                    }
                }}>

                    {!this.state.openAnimating && this.state.edit && <img className='create-box-back' src={BackBlack} alt='back' onClick={this.openRecipeBox}/>}
                    {!this.state.openAnimating && <img className='create-box-close' src={CloseBlack} alt='close' onClick={() => this.setState({closeAnimating: true})}/>}
                    {this.state.edit && <span className='create-box-id'>ID: {this.state.edit}</span>}
                    <h1 style={this.state.edit ? {marginBottom: '0px'} : {}}>{this.state.edit ? 'Edit' : 'Add'} Recipe</h1>
                    {this.state.edit && <button className='create-box-delete-recipe' onClick={() => this.setState({deletePrompt: true})}>Delete Recipe</button>}

                    {
                        this.state.deletePrompt &&
                        <div className='create-box-delete-prompt-background'>
                            <div className='create-box-delete-prompt'>
                                <h3>Delete {this.state.inputName ? this.state.inputName : 'recipe'}?</h3>
                                <button onClick={() => this.setState({deletePrompt: false})}>Cancel</button> <button className='create-box-delete-button' onClick={() => {
                                    if (this.state.submitLoading) return
                                    this.setState({submitLoading: true})

                                    this.props.ipcRenderer.invoke('recipes:remove', this.state.edit)
                                    .then(() => {
                                        this.props.refreshRecipes()
                                        this.props.unmount()
                                    })
                                }}>Delete</button>
                            </div>
                        </div>
                    }

                    <div className='create-box-url-input-wrapper'>
                        <label htmlFor='url'>URL</label>
                        <input className='create-box-url-input' type='text' id='url' name='url' placeholder='Paste URL... (optional)' defaultValue={this.state.url} onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                this.handleUrlInput(event.target.value)
                            } else {
                                this.setState({urlError: null})
                            }

                        }}
                        onChange={(event) => {
                            this.setState({url: event.target.value})
                        }}/>
                        {this.state.urlLoading && <img className='create-box-url-loading-wheel' src={LoadingWheel} alt='loading'/>}
                        <button className='create-box-autofill-button' onClick={() => this.handleUrlInput(this.state.url)}>Autofill</button>
                    </div>

                    {this.state.urlError && <span className='create-box-url-error'>{this.state.urlError}</span>}

                    <span className='create-box-supported-websites-button' onClick={() => this.setState({websiteList: !this.state.websiteList})}>{this.state.websiteList ? 'Hide' : 'See list of supported websites'}</span>
                    <ul className='create-box-supported-websites-list'>
                        {   
                            this.state.websiteList &&
                            ['cooking.nytimes.com', 'www.allrecipes.com']
                            .map((website) => {
                                const domain = 'https://' + website

                                return (
                                    <OutsideAnchor
                                        key={website}
                                        ipcRenderer={this.props.ipcRenderer}
                                        href={domain}
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
                            this.props.ipcRenderer.invoke('main:readImage')
                            .then(data => {
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
                                this.setState({inputImage: event.target.value})
                            }} onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    this.getImage(event.target.value)
                                } else {
                                    this.setState({imageError: null})
                                }
                            }}/>

                            {this.state.imageLoading && <img className='create-box-image-loading-wheel' src={LoadingWheel} alt='loading'/>}

                            <button onClick={() => this.getImage(this.state.inputImage)}>Grab Image</button>
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
                            this.setState({inputName: event.target.value})
                        }}/>

                        <label htmlFor='create-box-protein'>Protein</label>
                        <input type='text' id='create-box-protein' name='protein' placeholder='Main Protein... (leave blank if none)' value={this.state.inputProtein} onChange={(event) => {
                            this.setState({inputProtein: event.target.value})
                        }}/>

                    </div>

                    <div className='create-box-number-grid'>
                        <label>Total Cooking Time</label>
                        <div>
                            <div className='create-box-number-input-wrapper'>
                                <input type='number' min='0' name='cooking-time' value={this.state.inputHours} onChange={(event) => {
                                    this.setState({inputHours: event.target.value})
                                }}/>
                                <span> hours</span>
                            </div>
                            <div className='create-box-number-input-wrapper'>
                                <input type='number' min='0' max='59' name='cooking-time' value={this.state.inputMinutes} onChange={(event) => {
                                    this.setState({inputMinutes: event.target.value})
                                }}/>
                                <span> minutes</span>
                            </div>
                        </div>

                        <label htmlFor='create-box-servings'>Servings</label>
                        <div>
                            <input type='number' min='0' id='create-box-servings' name='servings' value={this.state.inputServings} onChange={(event) => {
                                this.setState({inputServings: event.target.value})
                            }}/>
                            <span> servings</span>
                        </div>
                    </div>

                    <h3>Meal</h3>
                    
                    <div className='create-box-meal-wrapper'>
                        {
                            this.meals
                            .map((meal) => (
                                <div className='create-box-checkbox-wrapper' key={meal}>
                                    <input type='checkbox' id={`create-box-${meal}`} name={meal} checked={this.state.inputMeal[meal]} onChange={(event) => {
                                        const newMeal = this.state.inputMeal
                                        newMeal[meal] = event.target.checked
                                        
                                        this.setState({inputMeal: newMeal})
                                    }}/>
                                    <label htmlFor={`create-box-${meal}`}>{capitalize(meal)}</label>
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
                    
                    <br />
                    <button className='create-box-submit-recipe-button' onClick={this.submitRecipe}>{this.state.edit ? 'Edit' : 'Add'} Recipe</button>

                </div>
            </div>
        )
    }
}

export default CreateBox