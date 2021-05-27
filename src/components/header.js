import AddCircle from '../images/addCircle.png';

function Header() {
    return (
        <div className='Header'>
            <div className='add-recipe-button-wrapper'>
                <button>
                    <img src={AddCircle} alt='Add a new recipe' />
                </button>
            </div>
        </div>
    )
};

export default Header;