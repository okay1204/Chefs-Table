import AddCircleBlack from '../images/addCircleBlack.png';

function Body({recipes, ipcRenderer}) {

    return (
        <div className='MainBody body'>
            {
                recipes && recipes.length === 0 && 
                <div className='center'>
                        <h2>Looks like you don't have any recipes!</h2>
                        <div className='center-image-in-text'>
                            <h3>Click the </h3><img src={AddCircleBlack} alt='Add recipe icon' className='inline-add-circle-icon'/><h3> icon on the top right to add your first recipe.</h3>
                        </div>    
                </div>
            }

            <span>{JSON.stringify(recipes)}</span>

            <button onClick={() => {
                ipcRenderer.recipes.add(recipes, {name: 'Some good pasta'})
            }}>add</button>
            <button onClick={() => {
                ipcRenderer.recipes.remove(recipes, '51fc18d5-b8f2-49b5-a687-a3215a679d58')
            }}>remove</button>
            <button onClick={() => {
                ipcRenderer.recipes.clear()
            }}>clear</button>
        </div>
    )
};

export default Body;