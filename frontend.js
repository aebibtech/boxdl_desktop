document.addEventListener('DOMContentLoaded', function(){
    const dlbtn = document.getElementById('download-btn');
    const openf = document.getElementById('open-folder');
    boxdl.waitStatus(document.getElementById('status'));

    dlbtn.addEventListener('click', async function(event){
        event.preventDefault();
        dlbtn.disabled = true;
        const links = document.getElementById('links').value;
        await boxdl.download(links);
        dlbtn.disabled = false;
    });

    openf.addEventListener('click', function(event){
        event.preventDefault();
        boxdl.openFolder();
    });
});

