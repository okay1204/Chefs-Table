import '../styles/createBox.css';
import 'animate.css/animate.min.css'
import React from 'react';

import CloseBlack from '../images/closeBlack.png';
import LoadingWheel from '../images/loadingWheel.gif';
import DeleteIcon from '../images/delete.png';

class CreateBox extends React.Component {

    constructor() {
        super();
        
        this.state = {
            animation: null,
            urlError: null,
            url: '',
            loading: false,
            inputName: '',
            inputProtein: '',
            inputIngredients: {},
            ingredientIdCount: 0
        };
        
        this.handleUrlInput = this.handleUrlInput.bind(this);
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

        this.setState({loading: true})

        this.props.ipcRenderer.recipes.webscrape(url)
        .then((recipeData) => {
            console.log(recipeData);
            this.setState({
                inputName: recipeData.name,
                inputProtein: recipeData.protein ? recipeData.protein : ''
            })
        })
        .catch((error) => {
            if (error.code === 'DOMAIN_UNSUPPORTED') {
                this.setState({urlError: 'Website not supported'});
            } else if (error.code === 'DOMAIN_REQUEST_ERROR') {
                this.setState({urlError: 'Failed request, is the url correct?'});
            } else {
                this.setState({urlError: 'Invalid recipe URL'});
            }
        })
        .finally(() => {
            this.setState({loading: false})
        });
    }

    render () {

        const ingredientsHTML = [];

        for (const [key, value] of Object.entries(this.state.inputIngredients)) {
            ingredientsHTML.push([
                <div key={'delete ' + key} className='create-box-ingredients-delete'><img src={DeleteIcon} alt='delete' onClick={() => {
                    // Using JSON.parse and JSON.stringify to clone object
                    const newIngredients = JSON.parse(JSON.stringify(this.state.inputIngredients));
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
                        {this.state.loading && <img className='create-box-loading-wheel' src={LoadingWheel} alt='loading'/>}
                        <button className='create-box-autofill-button' onClick={() => this.handleUrlInput(this.state.url)}>Autofill</button>
                    </div>

                    {this.state.urlError && <span className='create-box-error'>{this.state.urlError}</span>}

                    <hr />

                    <div className='create-box-input-grid'>
                        <label htmlFor='name'>Name</label>
                        <input type='text' name='name' placeholder='Recipe Name...' value={this.state.inputName} onChange={(event) => {
                            this.setState({inputName: event.target.value})
                        }}/>

                        <label htmlFor='protein'>Protein</label>
                        <input type='text' name='protein' placeholder='Main Protein... (leave blank if none)' value={this.state.inputProtein} onChange={(event) => {
                            this.setState({inputProtein: event.target.value})
                        }}/>

                    </div>

                    <h3>Ingredients</h3>
                    <ul className='create-box-ingredients-list'>
                        {ingredientsHTML}
                    </ul>
                    <button onClick={() => {
                        // Using JSON.parse and JSON.stringify to clone object
                        const newIngredients = JSON.parse(JSON.stringify(this.state.inputIngredients));
                        newIngredients[this.state.ingredientIdCount] = '';

                        this.setState({
                            ingredientIdCount: this.state.ingredientIdCount + 1,
                            inputIngredients: newIngredients
                        });
                    }}>+</button>

                </div>
            </div>
        )
    };
}

export default CreateBox;