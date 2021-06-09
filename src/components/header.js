import '../styles/header.css';
import React from 'react';
import CreateBox from './createBox.js';

import ClickOutside from '../components/clickOutside.js';
import AddCircleEmerald from '../images/addCircleEmerald.png';
import ExpandEmerald from '../images/expandEmerald.png';


class Header extends React.Component {

    constructor() {
        super();

        this.state = {
            miniCreateBox: false,
            miniCreateBoxUrl: '',
            createBox: false
        }

        this.miniCreateBoxUrlInput = React.createRef();
    }

    render() {
        return (
            <div className='Header'>
                <div className='add-recipe-button-wrapper'>
                    <button className='add-recipe-button' onClick={() => {

                        if (this.state.miniCreateBox) {
                            this.miniCreateBoxUrlInput.current.blur();
                        } else {
                            this.miniCreateBoxUrlInput.current.focus();
                        }

                        this.setState({
                            miniCreateBox: !this.state.miniCreateBox
                        });

                    }}>
                        <img src={AddCircleEmerald} alt='Add a new recipe' />
                    </button>
                </div>
    
                {/* mini create box with url input only */}
                <ClickOutside onClick={() => this.setState({miniCreateBox: false})}>
                    <div className={`mini-create-box ${this.state.miniCreateBox ? '' : 'hidden'}`}>
                        <h1 className='mini-create-box-title'>Enter URL</h1>
                        <input className='mini-create-box-url-input' type='text' value={this.state.miniCreateBoxUrl} placeholder='Paste URL...' ref={this.miniCreateBoxUrlInput}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    this.setState({
                                        createBox: {sendRequest: true, url: this.state.miniCreateBoxUrl},
                                        miniCreateBox: false
                                    });
                                }
                            }}
                            onChange={(event) => {
                                this.setState({
                                    miniCreateBoxUrl: event.target.value
                                });
                            }}
                        />
                        <button className='mini-create-box-expand-wrapper'>
                            <img className='mini-create-box-expand' src={ExpandEmerald} alt='Expand' onClick={() => {
                                this.setState({
                                    createBox: {sendRequest: false, url: this.state.miniCreateBoxUrl},
                                    miniCreateBoxUrl: '',
                                    miniCreateBox: false
                                })
                            }}/>
                        </button>
                    </div>
                </ClickOutside>
    
                {/* large create box */}
                {
                    this.state.createBox &&
                    <CreateBox unmount={() => this.setState({createBox: false})} ipcRenderer={this.props.ipcRenderer} initialValue={this.state.createBox}/>
                }
    
            </div>
        )
    }
};

export default Header;