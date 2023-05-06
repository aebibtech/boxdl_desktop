const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('boxdl', {
    download: function(boxUrls){
        ipcRenderer.invoke('download', boxUrls);
    },
    waitStatus: function(element){
        ipcRenderer.on('status', function(event, ...args){
            element.innerText = args[0];
        });
    },
    openFolder: function(){
        ipcRenderer.invoke('open-folder');
    }
});