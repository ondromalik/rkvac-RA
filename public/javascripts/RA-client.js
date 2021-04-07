{
    function checkRA() {
        fetch('/check-ra-key-RA', {
            method: 'GET'
        }).then((response) => {
            response.json().then((data) => {
                console.log(data.key);
                if (data.key) {
                    document.getElementById('RAFiles').hidden = false;
                    document.getElementById('revocation').hidden = false;
                    document.getElementById('initiatingRA').hidden = true;
                    return;
                }
                if (!data.key) {
                    document.getElementById('RAFiles').hidden = true;
                    document.getElementById('revocation').hidden = true;
                    document.getElementById('initiatingRA').hidden = false;
                    return;
                }
                throw new Error('Request failed.');
            }).catch(function(error) {
                console.log(error);
            })
        });
    }

    const initiateRAButton = document.getElementById('initiateRAButton');
    initiateRAButton.addEventListener('click', function(e) {
        fetch('/initiateRA', {
            method: 'POST'
        }).then(function (response) {
            response.json().then((data) => {
                if (data.success) {
                    document.getElementById('messageHandlerOK').hidden = false;
                    document.getElementById('messageHandlerError').hidden = true;
                    checkRA();
                    return;
                }
                if (!data.success) {
                    document.getElementById('messageHandlerOK').hidden = true;
                    document.getElementById('messageHandlerError').hidden = false;
                    return;
                }
                throw new Error('Request failed.');
            }).catch(function (error) {
                console.log(error);
            })
        });
        connect();
    });

    const revokeIDButton = document.getElementById('revokeIDButton');
    revokeIDButton.addEventListener('click', () => {
        let userID = document.getElementById('userID').value;
        let userC = document.getElementById('userC').value;
        let epochNumber = document.getElementById('epochNumberID').value;
        let verifierAddress = document.getElementById('verifierAddress').value;
        let revokeUser = {
            id: userID,
            C: userC,
            epoch: epochNumber,
            verifierAddress: verifierAddress
        };
        if (userID !== "") {
            fetch('/post-revoke-user-ID', {
                method: 'POST',
                body: JSON.stringify(revokeUser),
                headers: { 'Content-Type': 'application/json'}
            }).then((response) => {
                response.json().then((data) => {
                    if(data.success) {
                        document.getElementById('messageRevokeOK').hidden = false;
                        document.getElementById('messageRevokeError').hidden = true;
                        return;
                    }
                    if(!data.success) {
                        document.getElementById('messageRevokeOK').hidden = true;
                        document.getElementById('messageRevokeError').hidden = false;
                        return;
                    }
                    throw new Error('Request failed.');
                }).catch(function(error) {
                    console.log(error);
                })
            });
        }
        else if (userC !== "") {
            fetch('/post-revoke-user-C', {
                method: 'POST',
                body: JSON.stringify(revokeUser),
                headers: { 'Content-Type': 'application/json'}
            }).then((response) => {
                response.json().then((data) => {
                    if(data.success) {
                        document.getElementById('messageRevokeOK').hidden = false;
                        document.getElementById('messageRevokeError').hidden = true;
                        return;
                    }
                    if(!data.success) {
                        document.getElementById('messageRevokeOK').hidden = true;
                        document.getElementById('messageRevokeError').hidden = false;
                        return;
                    }
                    throw new Error('Request failed.');
                }).catch(function(error) {
                    console.log(error);
                })
            });
        }
    });

    document.getElementById('userID').addEventListener('change', () => {
        if (document.getElementById('userID').value !== "") {
            document.getElementById('userC').disabled = true;
            document.getElementById('inputMessage').hidden = false;
            document.getElementById('labelC').className = document.getElementById('labelC').className.replace("w3-text-black", "w3-text-gray");
        } else {
            document.getElementById('userC').disabled = false;
            document.getElementById('inputMessage').hidden = true;
            document.getElementById('labelC').className = document.getElementById('labelC').className.replace("w3-text-gray", "w3-text-black");
        }
    });

    document.getElementById('userC').addEventListener('change', () => {
        if (document.getElementById('userC').value !== "") {
            document.getElementById('userID').disabled = true;
            document.getElementById('inputMessage').hidden = false;
            document.getElementById('labelID').className = document.getElementById('labelID').className.replace("w3-text-black", "w3-text-gray");
        } else {
            document.getElementById('userID').disabled = false;
            document.getElementById('inputMessage').hidden = true;
            document.getElementById('labelID').className = document.getElementById('labelID').className.replace("w3-text-gray", "w3-text-black");
        }
    });

    window.onload = checkRA;
}