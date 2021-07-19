import React from 'react'

function DisableBodyScroll() {

    // set body overflow to prevent scrolling outside of the component
    React.useEffect(() => {
        document.body.style.overflow = 'hidden'
        
        return () => {
            document.body.style.overflow = 'unset'
        }
    })

    return (
        <div id='disable-body-scroll'></div>
    )
}

export default DisableBodyScroll