{
    function hexToBlob(hexstring) {
        var byteArray = new Uint8Array(hexstring.length/2);
        for (var x = 0; x < byteArray.length; x++){
            byteArray[x] = parseInt(hexstring.substr(x*2,2), 16);
        }
        return new Blob([byteArray], {type: ""});
    }

    async function blobToHex(blob) {
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const byteArray = await new Uint8Array(arrayBuffer);
        var hexStr = '';
        for (var i = 0; i < byteArray.length; i++) {
            var hex = (byteArray[i] & 0xff).toString(16);
            hex = (hex.length === 1) ? '0' + hex : hex;
            hexStr += hex;
        }
        return hexStr.toUpperCase();
    }

    async function contactCard(hexdata) {
        var _readers = await navigator.webcard.readers();
        if (!_readers[0]) {
            throw new Error('Card not connected');
        }
        let atr = await _readers[0].connect(true);
        let res = await _readers[0].transcieve(hexdata);
        _readers[0].disconnect();
        return res;
    }

    function connect() {
        // console.log("Connecting");
        const socket = new WebSocket('wss://' + location.hostname + ':' + location.port);
        socket.addEventListener('message', function (event) {
            blobToHex(event.data).then(hexStr => {
                console.log("APDU request: " + hexStr);
                contactCard(hexStr).then(returnMessage => {
                    console.log("APDU response: " + returnMessage);
                    socket.send(hexToBlob(returnMessage));
                }).catch((error) => {
                    socket.send("error");
                    console.log(error);
                    socket.close();
                });
            });
        });
    }
}