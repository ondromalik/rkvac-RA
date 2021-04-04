{
    function checkRA() {
        fetch('/check-ra-key-RA', {
            method: 'GET'
        }).then(function(response) {
            if(response.ok) {
                document.getElementById('initiatingRA').hidden = true;
                document.getElementById('RAFiles').hidden = false;
                return;
            }
            if(response.status === 503) {
                console.log('RKVAC is not ready');
                return;
            }
            throw new Error('Request failed.');
        }).catch(function(error) {
            console.log(error);
        });
    }

    const initiateRAButton = document.getElementById('initiateRAButton');
    initiateRAButton.addEventListener('click', function(e) {
        fetch('/initiateRA', {
            method: 'POST'
        }).then(function (response) {
            if (response.ok) {
                console.log('OK');
                location.reload();
                return;
            }
            if (response.status === 503) {
                console.log('NOT OK');
                return;
            }
            throw new Error('Request failed.');
        }).catch(function (error) {
            console.log(error);
        });
        connect();
    });

    // document.getElementById("connectButton").addEventListener('click', connect);

    window.onload = checkRA;
}