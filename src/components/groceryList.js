import React from 'react'
import BoxWindow from './boxWindow.js'

import '../styles/groceryList.css'

class GroceryList extends React.Component {
    constructor() {
        super()

        this.state = {
            ingredients: {}
        }
    }

    render() {
        return (
            <BoxWindow unmount={this.props.unmount}>

            </BoxWindow>
        )
    }
}

export default GroceryList