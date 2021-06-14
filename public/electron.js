const path = require('path')
const { app, ipcMain, BrowserWindow, shell, dialog } = require('electron')
const isDev = require('electron-is-dev')
const fs = require('fs').promises
const { WebScrape } = require('./webscrape.js')
const Database = require('better-sqlite3')
const axios = require('axios')

// Conditionally include the dev tools installer to load React Dev Tools
let installExtension, REACT_DEVELOPER_TOOLS

if (isDev) {
    const devTools = require('electron-devtools-installer')
    installExtension = devTools.default
    REACT_DEVELOPER_TOOLS = devTools.REACT_DEVELOPER_TOOLS
}

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
        contextIsolation: false,
        devTools: isDev ? true : false
    }
    })

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
    installExtension(REACT_DEVELOPER_TOOLS)
        .then(name => console.log(`Added Extension:  ${name}`))
        .catch(error => console.log(`An error occurred: , ${error}`))
    }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    db.close()
    if (process.platform !== 'darwin') {
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

const DATABASE_PATH = isDev
? path.join(path.dirname(__dirname), 'dev', 'chefs-table.db')
: path.join(app.getPath('userData'), 'chefs-table.db')

const db = new Database(DATABASE_PATH)

// set up all tables
db.prepare('CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, imageUrl TEXT, protien TEXT, meal TEXT, instructions TEXT)').run()
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
        data = await fs.readFile(filePaths[0])
        return data
    } else {
        return null
    }
})

// Recipes

ipcMain.handle('recipes:read', async () => {
    return db.prepare('SELECT * FROM recipes').all()
})

ipcMain.handle('recipes:add', async (event, newRecipe) => {
    
    const columns = Object.keys(newRecipe).join(', ')
    const values = new Array(Object.values(newRecipe).length + 1).join('?').split('').join(', ')

    const { lastInsertRowid } = db.prepare(`INSERT INTO recipes (${columns}) VALUES (${values})`).run(...Object.values(newRecipe))

    newRecipe.id = lastInsertRowid

    return newRecipe
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

ipcMain.handle('recipes:remove', async (event, recipeIdToRemove) => {
    const removedRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeIdToRemove)
    
    db.prepare('DELETE FROM recipes WHERE id = ?').run(recipeIdToRemove)
    
    return removedRecipe
})

ipcMain.handle('recipes:clear', async () => {
    db.prepare('DELETE FROM recipes').run()
    return []
})

// Ingredients

ipcMain.handle('ingredients:add', async (event, ingredient) => {
    const { lastInsertRowid } = db.prepare('INSERT INTO ingredients (recipeId, ingredient) VALUES (?, ?)').run(ingredient.recipeId, ingredient.ingredient)
    
    ingredient.id = lastInsertRowid
    
    return ingredient
})

ipcMain.handle('ingredients:remove', async (event, ingredientIdToRemove) => {
    const removedIngredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientIdToRemove)

    db.prepare('DELETE FROM ingredients WHERE id = ?').run(ingredientIdToRemove)

    return removedIngredient
})

ipcMain.handle('ingredients:clear', async (event, recipeId) => {
    db.prepare('DELETE FROM ingredients WHERE recipeId = ?').run(recipeId)
    
    return []
})