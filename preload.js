const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('boxdl', {
    download: async function(boxUrls){
        await ipcRenderer.invoke('download', boxUrls);
    },
    waitStatus: function(element){
        ipcRenderer.on('status', function(event, ...args){
            element.innerText = args[0];
        });
    },
    openFolder: async function(){
        await ipcRenderer.invoke('open-folder');
    },
    changeLocation: async function(){
        await ipcRenderer.invoke('change-location');
    }
});