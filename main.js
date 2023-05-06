if (require('electron-squirrel-startup')) return;

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const puppeteer = require('puppeteer');
const { download } = require('electron-dl');

let win = null;

function urlChecker(url){
    return /https:\/\/(.*)\.box\.com\/(.*)/.test(url);
}

async function handleDownload(event, ...args){
    if(args[0] === ""){
        dialog.showMessageBox(win, {
            type: 'info',
            title: 'BoxDL',
            detail: 'Enter a valid Box.com link'
        });
        return;
    }
    const currentDate = Date.now();
    const links = args[0].split(/\s/);
    let allLinksValid = false;
    let realTitle = "";

    links.forEach(function(link){
        allLinksValid = urlChecker(link);
    });

    if(!allLinksValid){
        dialog.showMessageBox(win, {
            type: 'error',
            title: 'Error',
            detail: 'Some of the links are invalid'
        });
        return;
    }

    links.forEach(async function(link){
        win.webContents.send('status', `Scraping`);
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process', '--no-zygote']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(link, { waitUntil: "networkidle0" });
        const title = await page.title();
        realTitle = title !== null ? title.slice(0, title.indexOf("|") - 1) + currentDate : realTitle;
        win.webContents.send('status', `Title: ${realTitle}`);
        const networkRequestsStr = await page.evaluate(function(){
            return JSON.stringify(window.performance.getEntries());
        });
        const networkRequests = JSON.parse(networkRequestsStr);
        let downloadUrl = "";
        for(let j = 0; j < networkRequests.length; j++){
            if(((networkRequests[j].name.includes("public.boxcloud.com/api/2.0/files") || "dl.boxcloud.com/api/2.0/files") && networkRequests[j].name.includes("content?preview=true")) || (networkRequests[j].name.includes("internal_files") && networkRequests[j].name.includes("pdf")) ){
                downloadUrl = networkRequests[j].name;
            }else{
                continue;
            }
        }
        if(downloadUrl !== ""){
            try{
                win.webContents.send('status', `Downloading`);
                await download(win, downloadUrl, { filename: `${realTitle}.pdf`, overwrite: true });
                win.webContents.send('status', "Download successful.");
            }catch(e){
                win.webContents.send('status', "Download failed.")
            }
        }
        await page.close();
        win.webContents.send('status', 'Ready.');
    });
}

function createWindow(){
    win = new BrowserWindow({
        width: 450,
        height: 450,
        maximizable: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '/icons/linux.png')
    });
    win.loadFile('index.html');
    win.removeMenu();
}

app.whenReady().then(function(){
    createWindow();
    ipcMain.handle('download', handleDownload);
    ipcMain.handle('open-folder', async function(){
        await shell.openPath(app.getPath('downloads'));
    });
    app.on('activate', function(){
        if(BrowserWindow.getAllWindows().length === 0){
            createWindow();
        }
    });
});

app.on('window-all-closed', function(){
    if(process.platform !== 'darwin'){
        app.quit();
    }
});