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
        let startTime = Date.now();
        startLoader();
        let tableRows = document.getElementsByClassName('cardSelector');
        let selectedCard = "";
        for (let i = 0; i < tableRows.length; i++) {
            if (tableRows[i].checked) {
                selectedCard = tableRows[i];
            }
        }
        fetch('/issueHandler', {
            method: 'POST'
        }).then(function (response) {
            console.log(Date.now() - startTime);
            response.json().then((data) => {
                hideLoader();
                document.getElementById('rkvacUsed').hidden = true;
                if (data.rkvacUsed) {
                    document.getElementById('rkvacUsed').hidden = false;
                    return;
                }
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
                hideLoader();
                console.log(error);
            })
        });
        connect(selectedCard.value);
    });

    const revokeIDButton = document.getElementById('revokeIDButton');
    revokeIDButton.addEventListener('click', () => {
        let userID = document.getElementById('userID').value;
        let userC = document.getElementById('userC').value;
        let epochNumber = document.getElementById('epochNumberID').value;
        let verifierAddress = document.getElementById('verifierAddress').value;
        if (verifierAddress === "") verifierAddress = '127.0.0.1';
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
            document.getElementById('epochNumberID').disabled = true;
            document.getElementById('inputMessage').hidden = false;
            document.getElementById('epochMessage').hidden = false;
            document.getElementById('labelC').className = document.getElementById('labelC').className.replace("w3-text-black", "w3-text-gray");
            document.getElementById('labelEpoch').className = document.getElementById('labelEpoch').className.replace("w3-text-black", "w3-text-gray");
        } else {
            document.getElementById('userC').disabled = false;
            document.getElementById('epochNumberID').disabled = false;
            document.getElementById('inputMessage').hidden = true;
            document.getElementById('epochMessage').hidden = true;
            document.getElementById('labelC').className = document.getElementById('labelC').className.replace("w3-text-gray", "w3-text-black");
            document.getElementById('labelEpoch').className = document.getElementById('labelEpoch').className.replace("w3-text-gray", "w3-text-black");
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
        var really = confirm("You are about to delete all RKVAC configuration\nDo you want to continue?");
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

    async function contactCard(index, hexdata) {
        var _readers = await navigator.webcard.readers();
        let atr = await _readers[index].connect(true);
        console.log("APDU request: " + hexdata);
        let res = await _readers[index].transcieve(hexdata);
        _readers[index].disconnect();
        return res;
    }

    async function ListReaders() {
        var reader_ul = document.getElementById('readerList');
        while (reader_ul.firstChild) {
            reader_ul.removeChild(reader_ul.firstChild);
        }
        var _readers = await navigator.webcard.readers();
        if (_readers[0]) {
            _readers.forEach((reader, index) => {
                var node = document.createElement('li');
                reader_ul.append(node)
                node.outerHTML = `
          <div class="" tabindex="${index}" onclick="testReader(${index})">
                <input type="radio" class="w3-radio w3-bar-item cardSelector" name="cardIndex" value="${index}" onclick="enableLogin()">
                    <label style="font-weight: bold">${reader.name}</label>
                    <label style="font-style: italic">(${reader.atr === "" ? "Card not inserted" : "Card inserted"})</label>
                </input>
                </div>
          `;

            })
            document.getElementById('cardStatus').hidden = true;
        }
    }

    function startLoader() {
        document.getElementById('login-loader').hidden = false;
    }

    function hideLoader() {
        document.getElementById('login-loader').hidden = true;
    }

    function enableLogin() {
        document.getElementById('issueHandlerButton').disabled = false;
    }

    function testReader(index) {
        startCardLoader();
        contactCard(index, '00A40400077675743231303100').then(res => {
            hideCardLoader();
            if (res === '9000') {
                document.getElementById("cardConnected").hidden = false;
                document.getElementById("cardDisconnected").hidden = true;
            }
            else {
                document.getElementById("cardConnected").hidden = true;
                document.getElementById("cardDisconnected").hidden = false;
            }
            console.log("APDU response: " + res);
        }).catch(function (error) {
            hideCardLoader();
            document.getElementById("cardDisconnected").hidden = false;
            document.getElementById("cardConnected").hidden = true;
            console.log(error);
        });
    }

    function startCardLoader() {
        document.getElementById('card-loader').hidden = false;
    }

    function hideCardLoader() {
        document.getElementById('card-loader').hidden = true;
    }

    function onLoad() {
        checkRA();
        ListReaders();
    }

    window.onload = onLoad;
}