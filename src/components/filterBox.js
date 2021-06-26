import '../styles/filterBox.css'
import React from 'react'
import {capitalize, MEALS, clamp } from '../utils.js'

import XRed from '../images/closeRed.png'
import SlashGray from '../images/slashGray.png'
import CheckEmerald from '../images/checkEmerald.png'
import DeleteIcon from '../images/delete.png'
import FilterEmerald from '../images/filterEmerald.png'

class FilterBox extends React.Component {
    
    constructor() {
        super()

        this.emptyFilterMeals = {}
        MEALS.forEach((meal) => this.emptyFilterMeals[meal] = null)

        this.state = {
            inputName: '',
            inputProtein: '',
            // inputProteinText is for actual text, while protein can have null value for none
            inputProteinText: '',
            inputTimeFilter: 0,
            inputHours: 0,
            inputMinutes: 0,
            inputMeals: this.emptyFilterMeals,
            inputIngredients: {},
            ingredientIdCount: 0,
            focusLastIngredient: false,
            fadeAll: false
        }

        this.updateMeals = this.updateMeals.bind(this)
        this.addIngredient = this.addIngredient.bind(this)

        this.lastIngredientRef = React.createRef()
    }

    updateMeals(updates) {
        const meals = this.state.inputMeals

        Object.assign(meals, updates)

        this.setState({inputMeals: meals})
    }

    addIngredient(ingredient) {
        const newIngredients = this.state.inputIngredients
        newIngredients[this.state.ingredientIdCount] = ingredient

        this.setState({
            ingredientIdCount: this.state.ingredientIdCount + 1,
            inputIngredients: newIngredients
        })
    }

    componentDidUpdate() {
        // for focusing to last ingredient if enter was pressed
        if (this.state.focusLastIngredient) {
            this.lastIngredientRef.current.focus()

            this.setState({focusLastIngredient: false})
        }
    }

    render() {

        let ingredientsHTML = []

        let i = 1
        for (const key of Object.keys(this.state.inputIngredients)) {
            let inputRef = false
            if (i === Object.keys(this.state.inputIngredients).length) {
                inputRef = true
            }

            ingredientsHTML.push([
                <div key={'delete ' + key} className='filter-box-ingredients-delete'><img src={DeleteIcon} alt='delete' onClick={() => {
                    const newIngredients = this.state.inputIngredients
                    delete newIngredients[key]

                    this.setState({
                        inputIngredients: newIngredients
                    })
                }}/></div>,
                <input key={'input ' + key} ref={inputRef ? this.lastIngredientRef : null} type='text' placeholder='Recipe ingredient...' value={this.state.inputIngredients[key]} onChange={event => {

                    const newIngredients = JSON.parse(JSON.stringify(this.state.inputIngredients))
                    newIngredients[key] = event.target.value
                    
                    this.setState({
                        inputIngredients: newIngredients
                    })
                }} onKeyDown={event => {
                    if (event.key === 'Enter') {
                        this.setState({focusLastIngredient: true})
                        this.addIngredient('')
                    }
                }}/>
            ])

            i++
        }

        return (
            <div className={`filter-box ${this.state.fadeAll ? 'filter-box-fade-all' : ''}`} onAnimationEnd={() => this.setState({fadeAll: false})}>

                <button className='filter-box-reset' onClick={() => this.setState({
                    inputName: '',
                    inputProtein: '',
                    inputProteinText: '',
                    inputTimeFilter: 0,
                    inputHours: 0,
                    inputMinutes: 0,
                    inputMeals: this.emptyFilterMeals,
                    inputIngredients: {},
                    ingredientIdCount: 0,
                    focusLastIngredient: false,
                    fadeAll: true
                })}>Reset to Default</button>

                <div className='filter-box-text-container'>
                    <div className='filter-box-text-wrapper'>
                        <label htmlFor='filter-name-input'>Name</label>
                        <input 
                            type='text' 
                            className='filter-name-input'
                            id='filter-name-input'
                            placeholder='Name Filter...'
                            value={this.state.inputName}
                            onChange={(event) => this.setState({inputName: event.target.value})}
                        />
                    </div>
                    <div className='filter-box-text-wrapper'>
                        <label htmlFor='filter-protein'>Protein</label>
                        <button onClick={() => this.setState({inputProtein: null})} className={this.state.inputProtein !== null ? 'filter-input-gray' : ''}>None</button>
                        <input
                            type='text'
                            readOnly={this.state.inputProtein === null}
                            id='filter-protein'
                            onClick={() => this.setState({inputProtein: ''})}
                            placeholder='Protein Filter...'
                            value={this.state.inputProteinText}
                            onChange={(event) => this.setState({inputProtein: event.target.value, inputProteinText: event.target.value})}
                        />
                    </div>
                </div>

                <h2>Total Cook Time</h2>
                <div className='filter-box-time-container'>
                    <select onChange={event => {
                        if (event.target.value === 'More than') {
                            this.setState({inputTimeFilter: 1})
                        } else {
                            this.setState({inputTimeFilter: 0})
                        }
                    }}>
                        <option>Less than</option>
                        <option>More than</option>
                    </select>
                    <div className='filter-box-time-wrapper'>
                        <input id='filter-box-hours'
                                type='number'
                                min='0'
                                value={this.state.inputHours}
                                onChange={event => this.setState({inputHours: Math.max(event.target.value, 0)})}
                        />
                        <label htmlFor='filter-box-hours'>Hours</label>
                    </div>
                    <div className='filter-box-time-wrapper'>
                        <input id='filter-box-minutes'
                                type='number'
                                min='0'
                                max='59'
                                value={this.state.inputMinutes}
                                onChange={event => this.setState({inputMinutes: clamp(0, event.target.value, 59)})}
                        />
                        <label htmlFor='filter-box-minutes'>Minutes</label>
                    </div>
                </div>

                <h2 className='filter-box-meals-header'>Meals</h2>
                <div className='filter-box-meals-container'>
                    {MEALS.map(meal => (
                        <div className='filter-box-meal-wrapper' key={meal}>
                            <h3>{capitalize(meal)}</h3>
                            <div className='filter-box-meal-buttons'>
                                <button className={`filter-box-meal-false ${this.state.inputMeals[meal] === false ? 'active' : ''}`} onClick={() => this.updateMeals({[meal]: false})}>
                                    <img src={XRed} alt='shouldnt include'/>
                                </button>
                                <button className={`filter-box-meal-null ${this.state.inputMeals[meal] === null ? 'active': ''}`} onClick={() => this.updateMeals({[meal]: null})}> 
                                    <img src={SlashGray} alt='doesnt matter'/>
                                </button>
                                <button className={`filter-box-meal-true ${this.state.inputMeals[meal] === true ? 'active': ''}`} onClick={() => this.updateMeals({[meal]: true})}> 
                                    <img src={CheckEmerald} alt='should include'/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div> 

                <h2>Ingredients</h2>
                <ul className='filter-ingredients-list'>
                    {ingredientsHTML}
                </ul>
                <button className='filter-ingredients-add-button' onClick={() => {
                        this.addIngredient('')
                        this.setState({focusLastIngredient: true})
                }}>+</button>

                <div className='filter-box-submit-container'>
                    <button className='filter-box-submit-cancel' onClick={() => this.props.setFilter(null)}>Unfilter</button>
                    <button className='filter-box-submit-filter' onClick={() => this.props.setFilter(this.state)}><img src={FilterEmerald} alt='Enter filter'/>Filter</button>
                </div>
            </div>
        )
    }
}

export default FilterBox