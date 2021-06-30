import React from 'react'

const { ipcRenderer } = window.require('electron')


class ErrorSender extends React.Component {
    componentDidCatch(error) {

        // set state to hide warning
        this.setState(null)

        ipcRenderer.invoke('main:logError', error)
    }

    render() {
        return (
            <div className='error-sender'>
                {this.props.children}
            </div>
        )
    }
}

export default ErrorSender