{
    async function refreshTable() {
        // console.log("Table refreshed!");
        const root = document.querySelector(".verifiersTable[data-url]");
        const table = root.querySelector(".table-verifiersTable");
        const response = await fetch(root.dataset.url).catch(function (error) {
            console.log(error);
        });
        const verifiersData = await response.json();
        let date = new Date();
        let dateFormat = date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ":" + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
        document.getElementById('updatedDate').innerHTML = "Updated: " + dateFormat;
        if (verifiersData.success === false) {
            return;
        }

        //Clear table
        table.querySelector("thead tr").innerHTML = "";
        table.querySelector("tbody").innerHTML = "";

        //Populate headers
        for (const header of verifiersData.headers) {
            table.querySelector("thead tr").insertAdjacentHTML("beforeend", `<th>${header}</th>`);
        }

        //Populate rows

        for (const row of verifiersData.rows) {
            table.querySelector("tbody").insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${row}</td>  
                    <td>
                         <i class="fas fa-trash w3-bar-item w3-button w3-hover-none" onclick="deleteVerifier('${row}')"></i>
                    </td>          
                </tr>
            `);
        }
    }

    document.getElementById('btnRefreshList').addEventListener('click', function (e) {
        document.getElementById('btnRefreshList').className += " table-refresh__button--refreshing";
        refreshTable().then(() => {
            document.getElementById('btnRefreshList').className = document.getElementById('btnRefreshList').className.replace(" table-refresh__button--refreshing", "");
        });
    })

    function deleteVerifier(host) {
        let verifier = {
            hostname: host
        }
        fetch('/delete-verifier', {
            method: 'POST',
            body: JSON.stringify(verifier),
            headers: {'Content-Type': 'application/json'}
        }).then(function (response) {
            response.json().then((data) => {
                if (data.success) {
                    refreshTable();
                    return;
                }
                if (!data.success) {
                    return;
                }
                throw new Error('Request failed.');
            }).catch(function (error) {
                console.log(error);
            });
        })
    }

    document.getElementById('btnNewHost').addEventListener('click', () => {
        let hostname = document.getElementById('hostname').value;
        let newVerifier = {
            hostname: hostname
        }
        fetch('/add-verifier', {
            method: 'POST',
            body: JSON.stringify(newVerifier),
            headers: {'Content-Type': 'application/json'}
        }).then(function (response) {
            response.json().then((data) => {
                if (data.success) {
                    refreshTable();
                    return;
                }
                if (!data.success) {
                    return;
                }
                throw new Error('Request failed.');
            }).catch(function (error) {
                console.log(error);
            });
        })
        document.getElementById('hostname').value = "";
    })

    window.onload = refreshTable;
}