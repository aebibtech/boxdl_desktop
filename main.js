if (require('electron-squirrel-startup')) return;

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const { download } = require('electron-dl');

let win = null;
let downloading = false;

function getBrowserPath(){
    const isWin32 = process.platform == "win32";
    const isLinux = process.platform == "linux";
    const firefoxPath = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const unixPath = "/usr/bin/chrome";
    const linuxFireFoxPath = "/usr/bin/firefox";
    if(isWin32 && fs.existsSync(chromePath)){
        return chromePath;
    }
    if(isWin32 && fs.existsSync(edgePath)){
        return edgePath;
    }
    if(isWin32 && fs.existsSync(firefoxPath)){
        return firefoxPath;
    }
    if(isLinux && fs.existsSync(unixPath)){
        return unixPath;
    }
    if(isLinux && fs.existsSync(linuxFireFoxPath)){
        return linuxFireFoxPath;
    }
    return unixPath;
}

function getDownloadLink(networkRequests){
    for(let j = 0; j < networkRequests.length; j++){
        if(((networkRequests[j].name.includes("public.boxcloud.com/api/2.0/files") || "dl.boxcloud.com/api/2.0/files") && networkRequests[j].name.includes("content?preview=true")) || (networkRequests[j].name.includes("internal_files") && networkRequests[j].name.includes("pdf"))){
            return networkRequests[j].name;
        }
    }
    return "";
}

function urlChecker(url){
    return /https:\/\/(.*)\.box\.com\/(.*)/.test(url);
}

async function singleDownload(link, currentDate){
    let realTitle = "";
    const executablePath = getBrowserPath();
    win.webContents.send('status', `Scraping`);
    const browser = !executablePath.includes("firefox") ? await puppeteer.launch({
        headless: "new",
        timeout: 0,
        executablePath: executablePath,
        channel: "chrome"
    }) : await puppeteer.launch({
        product: "firefox",
        executablePath: executablePath,
        headless: "true",
        timeout: 0
    });
    const page = await browser.newPage();
    if(!executablePath.includes("firefox")){
        await page.goto(link, { waitUntil: "networkidle0" });
    }else{
        await page.goto(link, { waitUntil: "domcontentloaded" });
    }
    const title = await page.title();
    realTitle = title.includes("|") ? title.slice(0, title.indexOf("|") - 1) + currentDate : realTitle;
    win.webContents.send('status', `Title: ${realTitle}`);
    const networkRequestsStr = await page.evaluate('JSON.stringify(window.performance.getEntries())');
    await browser.close();

    const networkRequests = JSON.parse(networkRequestsStr);
    let downloadUrl = getDownloadLink(networkRequests);
    
    
    return new Promise((resolve, reject) => {
        if(downloadUrl !== ""){
            win.webContents.send('status', `Downloading`);
            download(win, downloadUrl, { filename: `${realTitle}.pdf`, overwrite: true }).then(() => {
                resolve(`${realTitle}.pdf`);
                win.webContents.send('status', "Download successful.");
            });
        }else{
            win.webContents.send('status', "Download failed.");
            reject("Download failed.");
        }
    });
}

async function handleDownload(event, ...args){
    const currentDate = Date.now();
    
    if(args[0] === ""){
        dialog.showMessageBox(win, {
            type: 'info',
            title: 'BoxDL',
            detail: 'Enter a valid Box.com link'
        });
        return;
    }

    if(downloading){
        win.webContents.send('status', 'Download is in progress.');
        return;
    }

    const links = args[0].split(/\s/);
    let allLinksValid = false;

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

    downloading = true;

    for(let i = 0; i < links.length; i++){
        try{
            await singleDownload(links[i], currentDate);
        }catch(e){
            continue;
        }
    }

    win.webContents.send('status', 'Ready.');
    downloading = false;
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
    if(process.platform === 'win32'){
        app.setAppUserModelId("com.aebibtech.boxdl");
    }
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