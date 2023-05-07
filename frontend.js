document.addEventListener('DOMContentLoaded', function(event){
    const dlbtn = document.getElementById('download-btn');
    const openf = document.getElementById('open-folder');
    boxdl.waitStatus(document.getElementById('status'));

    if(event.key === 'Enter'){
        dlbtn.click();
    }

    dlbtn.addEventListener('click', async function(event){
        event.preventDefault();
        dlbtn.toggleAttribute('disabled', true);
        const links = document.getElementById('links').value;
        await boxdl.download(links);
        dlbtn.toggleAttribute('disabled', false);
    });

    openf.addEventListener('click', function(event){
        event.preventDefault();
        boxdl.openFolder();
    });
});

