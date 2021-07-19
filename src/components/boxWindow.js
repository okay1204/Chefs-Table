import React from 'react'

import '../styles/boxWindow.css'
import DisableBodyScroll from './disableBodyScroll.js'

import CloseBlack from '../images/closeBlack.png'

class GroceryList extends React.Component {
    constructor() {
        super()

        this.state = {
            ingredients: {},
            openAnimating: true,
            closeAnimating: false
        }
    }

    render() {
        return (
            <div className='box-window-wrapper'>

                {
                    !this.state.closeAnimating && 
                    <div className='box-window-background'><wbr /></div>
                }

                <DisableBodyScroll />

                <div className={`box-window ${this.state.closeAnimating ? 'box-window-animate-out' : ''} ${this.props.className ? this.props.className : ''}`} onAnimationEnd={() => {
                    if (this.state.closeAnimating) {
                        this.props.unmount()
                    } else {
                        this.setState({ openAnimating: false })
                    }
                }}>
                    {!this.state.openAnimating && <img className='box-window-close' src={CloseBlack} alt='close' onClick={() => this.setState({closeAnimating: true})}/>}
                    {!this.state.openAnimating && this.props.secondaryButton && <img className='box-window-secondary' src={this.props.secondaryButton.img} alt='close' onClick={this.props.secondaryButton.function}/>}
                    
                    {this.props.children}

                </div>
            </div>
        )
    }
}

export default GroceryList