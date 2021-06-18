import '../styles/outsideAnchor.css'

function OutsideAnchor({children, className, ipcRenderer, href}) {
    return (
        <span className={`outside-anchor ${className ? className : ''}`} onClick={() => ipcRenderer.send('main:loadGH', href)}>
            {children}
        </span>
    )
}

export default OutsideAnchor