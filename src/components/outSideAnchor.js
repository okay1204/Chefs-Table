import '../styles/outsideAnchor.css'

const { ipcRenderer } = window.require('electron')

function OutsideAnchor({children, className, href}) {
    return (
        <span className={`outside-anchor ${className ? className : ''}`} onClick={() => ipcRenderer.send('main:loadGH', href)}>
            {children}
        </span>
    )
}

export default OutsideAnchor