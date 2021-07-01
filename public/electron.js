const path = require('path')
const { app, ipcMain, BrowserWindow, shell, dialog, nativeImage } = require('electron')
const isDev = require('electron-is-dev')
const fs = require('fs')
const { WebScrape } = require('./webscrape.js')
const Database = require('better-sqlite3')
const axios = require('axios')
const log = require('electron-log')
const devTools = require('electron-devtools-installer')
const os = require('os')
const { electron } = require('process')

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

log.transports.file.level = 'info';

// do not log ExtensionLoadWarning as it is an issue with the library itself
console.error = error => !error.includes('ExtensionLoadWarning') && log.error(error)

console.warn = console.warn

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    app.quit()
}

let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: os.platform() === 'darwin' ? path.join(__dirname, 'chefs-table.icns') : path.join(__dirname, 'chefs-table.ico')
    })

    if (os.platform() === 'darwin') {
        const image = nativeImage.createFromPath(path.join(__dirname, 'chefs-table.icns'))
        app.dock.setIcon(image)
    }

    // Hide top menu bar during production
    if (!isDev) {
        mainWindow.setMenuBarVisibility(false)
    }

    mainWindow.loadURL(
    isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`
    )

    // Open the DevTools.
    if (isDev) {
        mainWindow.webContents.on("did-frame-finish-load", () => {
            mainWindow.webContents.once("devtools-opened", () => {
                mainWindow.focus()
            })
            mainWindow.webContents.openDevTools()
        })
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    if (isDev) {
        devTools.default(devTools.REACT_DEVELOPER_TOOLS)
        .then(name => console.log(`Added Extension:  ${name}`))
        .catch(error => console.log(`An error occurred: , ${error}`))
    }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        db.close()
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

const RESOURCE_PATH = isDev
? path.join(path.dirname(__dirname), 'dev')
: app.getPath('userData')

const DATABASE_PATH = path.join(RESOURCE_PATH, 'chefs-table.db')
const IMAGES_PATH = path.join(RESOURCE_PATH, '/images')
fs.promises.mkdir(IMAGES_PATH, { recursive: true })

if (!fs.existsSync(DATABASE_PATH)) {
    fs.writeFileSync(DATABASE_PATH, '')
}
const db = new Database(DATABASE_PATH)

// set up all tables
db.prepare('CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, image TEXT, name TEXT, protein TEXT, totalMinutes INTEGER, servings INTEGER, instructions TEXT)').run()
db.prepare('CREATE TABLE IF NOT EXISTS ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, recipeId INTEGER NOT NULL, ingredient TEXT)').run()
db.prepare('CREATE TABLE IF NOT EXISTS meals (id INTEGER PRIMARY KEY AUTOINCREMENT, recipeId INTEGER NOT NULL, meal TEXT)').run()

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Core processes

ipcMain.on('main:loadGH', (event, arg) => {
    shell.openExternal(arg)
})

ipcMain.handle('main:isImageUrl', async (event, url) => {
    let response

    try {
        response = await axios.get(url)
    } catch {
        return {
            isImage: false,
            code: 'REQUEST_FAILED'
        }
    }

    const supportedTypes = ['png', 'jpeg', 'webp'].map((extension) => 'image/' + extension)
    const contentType = response.headers['content-type']

    if (!contentType || !contentType.startsWith('image/')) {
        return {
            isImage: false,
            code: 'NOT_IMAGE_URL'
        }
    } else if (contentType.startsWith('image/') && !supportedTypes.includes(contentType)) {
        return {
            isImage: false,
            code: 'UNSUPPORTED_TYPE'
        }
    } else {
        return {
            isImage: true,
            code: 'SUCCESS'
        }
    }
})

ipcMain.handle('main:readImage', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Choose Image',
        buttonLabel: 'Choose Image',
        filters: [
            { name: 'Images', extensions: ['png', 'jpeg', 'jpg', 'webp'] }
        ]
    })

    if (filePaths.length > 0) {
        data = await fs.promises.readFile(filePaths[0])
        return data
    } else {
        return null
    }
})

ipcMain.handle('main:logError', (event, error) => {
    log.error('Renderer Process - ' + error.stack)
})

// Recipes

const RECIPES_PER_PAGE = 20

const addBackslashes = (string) => {
    return string.replace('%', '\\%').replace('_', '\\_')
}

const searchLike = (columnName) => {
    return `${columnName} LIKE '%' || ? || '%' ESCAPE '\\'`
}

const filterQuery = (get, filter, limit, offset) => {
    const queryArgs = []

    queryArgs.push(addBackslashes(filter.inputName))
        
    if (filter.inputProtein !== null) {
        queryArgs.push(addBackslashes(filter.inputProtein))
    }
    
    queryArgs.push((filter.inputHours * 60) + filter.inputMinutes)
    
    let shouldHaveMeals = []
    let shouldntHaveMeals = []
    
    for (let i = 0; i < Object.keys(filter.inputMeals).length; i++) {
        const meal = Object.keys(filter.inputMeals)[i]
        const value = Object.values(filter.inputMeals)[i]
    
        if (value === true) {
            shouldHaveMeals.push(`'${meal}'`)
        } else if (value === false) {
            shouldntHaveMeals.push(`'${meal}'`)
        }
    }
    
    if (shouldHaveMeals.length > 0) {
        queryArgs.push(shouldHaveMeals.length)
    }
    
    filter.inputIngredients = Object.values(filter.inputIngredients)
    filter.inputIngredients.forEach(ingredient => queryArgs.push(ingredient))

    if (limit && offset) {
        queryArgs.push(limit, offset)
    }

    return [db.prepare(
        `SELECT ${get} FROM recipes WHERE
            ${searchLike('name')}
        AND
            (${filter.inputProtein !== null ? searchLike('protein') + ' OR protein IS NULL' : 'protein IS NOT NULL'})
        AND
            totalMinutes ${filter.inputTimeFilter ? '>=' : '<='} ?
        ${shouldHaveMeals.length > 0 ?
            `
            AND
                (
                    SELECT COUNT(*) FROM meals WHERE meal IN (${shouldHaveMeals.join(', ')}) AND recipeId = recipes.id
                )
                = ?
            `
        : ''}
        ${shouldntHaveMeals.length > 0 ?
            `
            AND NOT EXISTS
                (
                    SELECT 1 FROM meals WHERE meal IN (${shouldntHaveMeals.join(', ')}) AND recipeId = recipes.id
                )
            `
        : ''}
        ${filter.inputIngredients.length > 0 ? 
            filter.inputIngredients.map(() => 
            `
            AND EXISTS 
                (
                    SELECT 1 FROM ingredients WHERE ${searchLike('ingredient')} AND recipeId = recipes.id
                )
            `)
            .join('')
        : ''}
        ORDER BY recipes.id DESC
        ${limit && offset ? 'LIMIT ? OFFSET ?' : ''}
    `), queryArgs]
}

ipcMain.handle('recipes:readPage', async (event, page, filter) => {
    
    const queryArgs = []
    const limit = RECIPES_PER_PAGE
    const offset = (page - 1) * RECIPES_PER_PAGE
    let recipes

    if (filter) {
        const [query, queryArgs] = filterQuery('id, name, image', filter, limit, offset)
        recipes = query.all(...queryArgs)
    } else {
        recipes = db.prepare(`SELECT id, image, name FROM recipes ORDER BY id DESC LIMIT ? OFFSET ?`).all(limit, offset)
    }

    for (i = 0; i < recipes.length; i++) {
        recipe = recipes[i]

        if (recipe.image === 'local') {
            recipe.image = await fs.promises.readFile(path.join(IMAGES_PATH, String(recipe.id)))
        } else if (!recipe.image) {
            recipe.image = await fs.promises.readFile(path.join(__dirname, 'no photo.png'))
        }
    }

    return recipes
})

ipcMain.handle('recipes:getTotalPages', async (event, filter) => {
    let count

    if (filter) {
        const [query, queryArgs] = filterQuery('COUNT(*) AS count', filter)
        count = query.get(queryArgs).count
    } else {
        count = db.prepare('SELECT COUNT(*) AS count FROM recipes').get().count
    } 

    return Math.ceil(count / RECIPES_PER_PAGE)
})

ipcMain.handle('recipes:readRecipe', async (event, recipeId) => {
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId)

    let imageType = 'url'
    if (recipe.image === 'local') {
        recipe.image = await fs.promises.readFile(path.join(IMAGES_PATH, String(recipeId)))
        imageType = 'binary'
    } else if (!recipe.image) {
        recipe.image = await fs.promises.readFile(path.join(__dirname, 'no photo.png'))
        imageType = 'none'
    }

    recipe.imageType = imageType

    const ingredients = db.prepare('SELECT ingredient FROM ingredients WHERE recipeId = ?').all(recipeId)
    recipe.ingredients = ingredients.map((ingredient) => Object.values(ingredient)[0])

    const meals = db.prepare('SELECT meal FROM meals WHERE recipeId = ?').all(recipeId)
    recipe.meals = meals.map((meal) => Object.values(meal)[0])

    return recipe
})

ipcMain.handle('recipes:add', async (event, newRecipe) => {

    const newRecipeTemplate = {
        url: newRecipe.url,
        name: newRecipe.name,
        protein: newRecipe.protein,
        instructions: newRecipe.instructions,
        totalMinutes: newRecipe.totalMinutes,
        servings: newRecipe.servings
    }
    
    const columns = Object.keys(newRecipeTemplate).join(', ')
    const values = new Array(Object.values(newRecipeTemplate).length + 1).join('?').split('').join(', ')
    
    const { lastInsertRowid } = db.prepare(`INSERT INTO recipes (${columns}) VALUES (${values})`).run(...Object.values(newRecipeTemplate))
    newRecipeTemplate.id = lastInsertRowid
    
    if (newRecipe.imageType) {
        // after getting the id, update with the image
        let image;
        if (newRecipe.imageType === 'url') {
            image = newRecipe.image
        } else {
            image = 'local'
            fs.promises.writeFile(path.join(IMAGES_PATH, String(lastInsertRowid)), newRecipe.image)
        }
        
        db.prepare('UPDATE recipes SET image = ? WHERE id = ?').run(image, lastInsertRowid)
    }

    // add all ingredients
    const addIngredient = db.prepare('INSERT INTO ingredients (recipeId, ingredient) VALUES (?, ?)')
    newRecipe.ingredients.forEach(ingredient => addIngredient.run(lastInsertRowid, ingredient))

    // add all meals
    const addMeal = db.prepare('INSERT INTO meals (recipeId, meal) VALUES (?, ?)')
    newRecipe.meals.forEach(meal => addMeal.run(lastInsertRowid, meal))
    
    log.info(`Added recipe with id ${lastInsertRowid}\n${JSON.stringify(newRecipeTemplate, null, 4)}`)
    return newRecipeTemplate
})

ipcMain.handle('recipes:edit', async (event, newRecipe) => {

    const newRecipeTemplate = {
        url: newRecipe.url,
        name: newRecipe.name,
        protein: newRecipe.protein,
        instructions: newRecipe.instructions,
        totalMinutes: newRecipe.totalMinutes,
        servings: newRecipe.servings
    }
    
    const updates = Object.keys(newRecipeTemplate).map(fieldName => fieldName + ' = ?').join(', ')
    
    db.prepare(`UPDATE recipes SET ${updates} WHERE id = ?`).run(...Object.values(newRecipeTemplate).concat(newRecipe.id))
    
    let oldImage = db.prepare('SELECT image FROM recipes WHERE id = ?').get(newRecipe.id).image
    if (oldImage === 'local') {
        await fs.promises.unlink(path.join(IMAGES_PATH, String(newRecipe.id)))
    }
    
    if (newRecipe.imageType) {
        // after getting the id, update with the image
        let image;
        if (newRecipe.imageType === 'url') {
            image = newRecipe.image
        } else {
            image = 'local'
            fs.promises.writeFile(path.join(IMAGES_PATH, String(newRecipe.id)), newRecipe.image)
        }
        
        db.prepare('UPDATE recipes SET image = ? WHERE id = ?').run(image, newRecipe.id)
    } else if (!newRecipe.imageType) {
        // delete image
        db.prepare('UPDATe recipes SET image = NULL WHERE id = ?').run(newRecipe.id)
    }

    // edit all ingredients
    db.prepare('DELETE FROM ingredients WHERE recipeId = ?').run(newRecipe.id)
    const addIngredient = db.prepare('INSERT INTO ingredients (recipeId, ingredient) VALUES (?, ?)')
    newRecipe.ingredients.forEach(ingredient => addIngredient.run(newRecipe.id, ingredient))

    // add all meals
    db.prepare('DELETE FROM meals WHERE recipeId = ?').run(newRecipe.id)
    const addMeal = db.prepare('INSERT INTO meals (recipeId, meal) VALUES (?, ?)')
    newRecipe.meals.forEach(meal => addMeal.run(newRecipe.id, meal))
    
    log.info(`Edited recipe with id ${lastInsertRowid}\n${JSON.stringify(newRecipe, null, 4)}`)
    return newRecipeTemplate
})

ipcMain.handle('recipes:remove', async (event, recipeIdToRemove) => {
    const image = db.prepare('SELECT image FROM recipes WHERE id = ?').get(recipeIdToRemove).image

    // delete saved image if exists
    if (image === 'local') {
        await fs.promises.unlink(path.join(IMAGES_PATH, String(recipeIdToRemove)))
    }
    
    db.prepare('DELETE FROM recipes WHERE id = ?').run(recipeIdToRemove)
    db.prepare('DELETE FROM ingredients WHERE recipeId = ?').run(recipeIdToRemove)
    db.prepare('DELETE FROM meals WHERE recipeId = ?').run(recipeIdToRemove)

    log.info('Removed recipe with id ' + recipeIdToRemove)
})

ipcMain.handle('recipes:clear', async () => {
    db.prepare('DELETE FROM recipes').run()
    db.prepare('DELETE FROM ingredients').run()
    db.prepare('DELETE FROM meals').run()
    fs.promises.readdir(IMAGES_PATH)
    .then(files => {
        files.forEach(file => {
            fs.promises.unlink(path.join(IMAGES_PATH, file))
        })
    })

    log.info('Cleared all recipes')
})

ipcMain.handle('recipes:webscrape', async (event, url) => {
    try {
        return {
            error: null,
            data: await WebScrape.getRecipeData(url)
        }
    } catch (error) {
        return {
            error: {
                message: error.message,
                code: error.code
            }
        }
    }
})
