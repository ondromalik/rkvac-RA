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

    const revokeIDButton = document.getElementById('revokeIDButton');
    revokeIDButton.addEventListener('click', () => {
        let userID = document.getElementById('userID').value;
        let epochNumber = document.getElementById('epochNumberID').value;
        let verifierAddress = document.getElementById('verifierAddress').value;
        let revokeUser = {
            id: userID,
            epoch: epochNumber,
            verifierAddress: verifierAddress
        };
        fetch('/post-revoke-user-ID', {
            method: 'POST',
            body: JSON.stringify(revokeUser),
            headers: { 'Content-Type': 'application/json'}
        }).then((response) => {
            if(response.ok) {
                document.getElementById('messageID').hidden = false;
                document.getElementById('messageID').innerHTML = 'Uživatel revokován';
                document.getElementById('messageID').className += " w3-text-green";
                location.reload();
                return;
            }
            if(response.status === 503) {
                document.getElementById('messageID').hidden = false;
                document.getElementById('messageID').innerHTML = 'Požadavek nebyl úspěšný';
                document.getElementById('messageID').className += " w3-text-red";
                return;
            }
            throw new Error('Request failed.');
        }).catch(function(error) {
            console.log(error);
        });
    });

    // document.getElementById("connectButton").addEventListener('click', connect);

    window.onload = checkRA;
}