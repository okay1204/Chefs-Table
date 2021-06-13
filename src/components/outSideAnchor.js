function OutsideAnchor({children, className, ipcRenderer, href}) {
    return (
        <span className={className ? className : ''} onClick={() => ipcRenderer.send('main:loadGH', href)}>
            {children}
        </span>
    )
}

export default OutsideAnchor;