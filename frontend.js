document.addEventListener('DOMContentLoaded', function(event){
    const dlbtn = document.getElementById('download-btn');
    const openf = document.getElementById('open-folder');
    const dloc = document.getElementById('download-location');
    boxdl.waitStatus(document.getElementById('status'));

    function clearDownloadField(){
        document.getElementById('links').value = "";
    }

    if(event.key === 'Enter'){
        dlbtn.click();
    }

    dlbtn.addEventListener('click', async function(event){
        event.preventDefault();
        const links = document.getElementById('links').value;
        await boxdl.download(links);
        clearDownloadField();
    });

    openf.addEventListener('click', async function(event){
        event.preventDefault();
        await boxdl.openFolder();
    });

    dloc.addEventListener('click', async function(event){
        event.preventDefault();
        await boxdl.changeLocation();
    });
});

