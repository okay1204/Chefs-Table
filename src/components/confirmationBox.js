import '../styles/confirmationBox.css'

import DisableBodyScroll from './disableBodyScroll.js'

function ConfirmationBox({onCancel, onConfirm, unmount, promptText, warningText, cancelButtonText = 'Cancel', confirmButtonText = 'Confirm'}) {
    return (
        <div className='confirmation-box-background'>
            <DisableBodyScroll />
            <div className='confirmation-box'>
                <h2 className='confirmation-box-prompt-text'>{promptText}</h2>
                <h3 className='confirmation-box-warning-text'>{warningText}</h3>

                <button className='confirmation-box-cancel' onClick={() => {
                    onCancel()
                    unmount()
                }}>
                    {cancelButtonText}
                </button>
                
                <button className='confirmation-box-confirm' onClick={() => {
                    onConfirm()
                    unmount()
                }}>
                    {confirmButtonText}
                </button>
            </div>
        </div>
    )
}

export default ConfirmationBox