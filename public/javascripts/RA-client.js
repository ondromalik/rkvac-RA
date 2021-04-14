{
    function checkRA() {
        fetch('/check-data', {
            method: 'GET'
        }).then((response) => {
            response.json().then((data) => {
                if (data.success) {
                    document.getElementById('initiatingRA').hidden = true;
                    return;
                }
                if (!data.success) {
                    document.getElementById('initiatingRA').hidden = false;
                    return;
                }
                throw new Error('Request failed');
            }).catch((error) => {
                console.log(error);
            });
        });
        fetch('/check-keys', {
            method: 'GET'
        }).then((response) => {
            response.json().then((data) => {
                if (data.publicKey) {
                    document.getElementById('uploadPk').hidden = true;
                    document.getElementById('downloadPk').hidden = false;
                }
                if (!data.publicKey) {
                    document.getElementById('uploadPk').hidden = false;
                    document.getElementById('downloadPk').hidden = true;
                }
                if (data.publicParam) {
                    document.getElementById('uploadPubParam').hidden = true;
                    document.getElementById('downloadPubParam').hidden = false;
                }
                if (!data.publicParam) {
                    document.getElementById('uploadPubParam').hidden = false;
                    document.getElementById('downloadPubParam').hidden = true;
                }
                if (data.privateKey) {
                    document.getElementById('uploadSk').hidden = true;
                    document.getElementById('downloadSk').hidden = false;
                }
                if (!data.privateKey) {
                    document.getElementById('uploadSk').hidden = false;
                    document.getElementById('downloadSk').hidden = true;
                }
                if (data.privateParam) {
                    document.getElementById('uploadParam').hidden = true;
                    document.getElementById('downloadParam').hidden = false;
                }
                if (!data.privateParam) {
                    document.getElementById('uploadParam').hidden = false;
                    document.getElementById('downloadParam').hidden = true;
                }
                if (data.publicKey && data.publicParam && data.privateKey && data.privateParam) {
                    document.getElementById('revocation').hidden = false;
                    document.getElementById('initiatingRA').hidden = true;
                } else {
                    document.getElementById('revocation').hidden = true;
                }
            }).catch(function (error) {
                console.log(error);
            })
        });
    }

    const issueRevokeHandler = document.getElementById('issueHandlerButton');
    issueRevokeHandler.addEventListener('click', function (e) {
        fetch('/issueHandler', {
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
                headers: {'Content-Type': 'application/json'}
            }).then((response) => {
                response.json().then((data) => {
                    if (data.success) {
                        document.getElementById('messageRevokeOK').hidden = false;
                        document.getElementById('messageRevokeError').hidden = true;
                        return;
                    }
                    if (!data.success) {
                        document.getElementById('messageRevokeOK').hidden = true;
                        document.getElementById('messageRevokeError').hidden = false;
                        return;
                    }
                    throw new Error('Request failed.');
                }).catch(function (error) {
                    console.log(error);
                })
            });
        } else if (userC !== "") {
            fetch('/post-revoke-user-C', {
                method: 'POST',
                body: JSON.stringify(revokeUser),
                headers: {'Content-Type': 'application/json'}
            }).then((response) => {
                response.json().then((data) => {
                    if (data.success) {
                        document.getElementById('messageRevokeOK').hidden = false;
                        document.getElementById('messageRevokeError').hidden = true;
                        return;
                    }
                    if (!data.success) {
                        document.getElementById('messageRevokeOK').hidden = true;
                        document.getElementById('messageRevokeError').hidden = false;
                        return;
                    }
                    throw new Error('Request failed.');
                }).catch(function (error) {
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

    document.getElementById('deletePkButton').addEventListener('click', () => {
        deleteFile("ra_pk.dat");
    });

    document.getElementById('deletePubParamButton').addEventListener('click', () => {
        deleteFile("ra_public_parameters.dat");
    });

    document.getElementById('deleteSkButton').addEventListener('click', () => {
        deleteFile("ra_sk.dat");
    });

    document.getElementById('deleteParamButton').addEventListener('click', () => {
        deleteFile("ra_parameters.dat");
    });

    document.getElementById('resetRKVAC').addEventListener('click', () => {
        var really = confirm("Chystáte se vymazat veškerou RKVAC konfiguraci.\nPřejete si pokračovat?");
        if (really) {
            fetch("/deleteData", {
                method: 'POST'
            }).then((response) => {
                response.json().then((data) => {
                    if (data.success) {
                        location.reload();
                        return;
                    }
                    document.getElementById('resetMessage').hidden = false;
                    throw new Error('Request failed.');
                }).catch((error) => {
                    console.log(error);
                });
            });
        }
    });

    function deleteFile(fileName) {
        let file = {
            fileName: fileName
        }
        fetch("/deleteFile", {
            method: 'POST',
            body: JSON.stringify(file),
            headers: {'Content-Type': 'application/json'}
        }).then((response) => {
            response.json().then((data) => {
                if (data.success) {
                    checkRA();
                    return;
                }
                throw new Error('Request failed.');
            }).catch((error) => {
                console.log(error);
            });
        });
    }

    window.onload = checkRA;
}