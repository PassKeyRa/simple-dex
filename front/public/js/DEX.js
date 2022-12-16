let id_bsc_address = "#bsc_address"
let id_connect_button = "#connect_button"



if (!contract_addr || !abi || !chainId) {
    alert("Error! ChainID, ABI or contract address isn't set");
}



/* Metamask functions */

var metamaskConnected = false;
let contract = undefined;
let web3 = undefined;
let account = undefined;

function disconnectMetamask() {
    if (metamaskConnected) {
        metamaskConnected = false;
        const bsc_address = document.querySelector(id_bsc_address);
        const connect_button = document.querySelector(id_connect_button);
        bsc_address.innerHTML = '';
        bsc_address.style.display = 'none';
        connect_button.style.display = '';
        web3 = contract = account = undefined;
    }
}

function checkConnected() {
    if (metamaskConnected === true && web3 !== undefined && contract !== undefined && account !== undefined && abi !== undefined) {
        return true;
    }

    alert('Metamask is not connected!');
    return false;
}

async function connectMetamask() {
    const { ethereum } = window;
    if (!ethereum || !ethereum.isMetaMask) {
        alert('Metamask not found!');
        return;
    }
    if (parseInt(ethereum.chainId) != chainId) {
        alert(`You should use Binance Smart Chain Testnet! (Chain id ${parseInt(ethereum.chainId)} != ${chainId})`);
        return;
    }
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    const bsc_address = document.querySelector(id_bsc_address);
    bsc_address.style.display = '';
    bsc_address.innerHTML = account + " (Connected)";
    metamaskConnected = true;
    const connectButton = document.querySelector(id_connect_button);
    connectButton.style.display = 'none';

    web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(abi, contract_addr);

    ethereum.on("chainChanged", () => {
        if (parseInt(ethereum.chainId) != chainId) {
            disconnectMetamask();
            alert("You should use BSC Testnet only! Change the network and connect again");
        }
    });

    ethereum.on("disconnect", () => {
        disconnectMetamask();
    });

    await updatePairs();
}


/* Common functions */

let id_pair_list = "#pair_list"
async function updatePairs() {
    if (checkConnected()) {
        let pair_list = document.querySelector(id_pair_list);
        let pairs = await fetchPairs();
        let html = "";
        for (var i = 0; i < pairs.length; i++) {
            html += `<a onclick="changePair('${pairs[i]}')">${pairs[i]}</a>`
        }
        pair_list.innerHTML = html;
    }
}

let id_pair_name = "#pair_name"
async function changePair(name) {
    let pair_field = document.querySelector(id_pair_name);
    pair_field.innerHTML = name;
}

async function getDecimals() {
    var pair = await getPair();
    if (!pair) return undefined;
    var decimals = parseInt(pair.price_decimals);
    return decimals;
}

async function priceDecode(p) {
    var decimals = await getDecimals();
    return `${parseFloat(p) / (10 ** decimals)}`
}

async function priceEncode(p) {
    var decimals = await getDecimals();
    return `${Math.floor(parseFloat(p) * (10 ** decimals))}`
}

async function listOrders() {
    var buy_orders = await fetchBuyOrders();
    var sell_orders = await fetchSellOrders();

}



/* DEX functions */

let id_owner_add_pair_name = "#owner_add_pair_name"
let id_owner_add_pair_decimals = "#owner_add_pair_decimals"
let id_owner_add_pair_1token_addr = "#owner_add_pair_1token_addr"
let id_owner_add_pair_2token_addr = "#owner_add_pair_2token_addr"
async function addPair() {
    let name = document.querySelector(id_owner_add_pair_name).value;
    let decimals = document.querySelector(id_owner_add_pair_decimals).value;
    let token1_addr = document.querySelector(id_owner_add_pair_1token_addr).value;
    let token2_addr = document.querySelector(id_owner_add_pair_2token_addr).value;
    if (!name || !decimals || !token1_addr || !token2_addr) return false;
    contract.methods.addPair(name, token1_addr, token2_addr, decimals).send({from: account})
      .then(async () => {alert('OK!'); await updatePairs();})
      .catch((err) => {alert(err.stack)});
}

let id_owner_del_pair_name = "#pair_name"
async function deletePair() {
    if (checkConnected()) {
        let name = document.querySelector(id_owner_del_pair_name).innerHTML;
        if (name == "Choose me right here") return;
        contract.methods.deletePair(name).send({from: account})
        .then(async () => {
                alert('OK!'); 
                await updatePairs();
                document.querySelector(id_owner_del_pair_name).innerHTML = "Choose me right here";
                document.querySelector(id_pair_list).innerHTML = "";
            })
        .catch((err) => {alert(err.stack)});
    }
}


async function fetchPairs() {
    if (checkConnected()) {
        var pairs = await contract.methods.fetchPairs().call();
        return pairs;
    }
    return [];
}

let id_get_pair_name = "#pair_name"
async function getPair() {
    if (checkConnected()) {
        let name = document.querySelector(id_get_pair_name).innerHTML;
        if (name == "Choose me right here") return undefined;
        var pair = await contract.methods.getPair(name).call();
        return pair;
    }
    return undefined;
}

let id_fetch_buy_orders_pair_name = "#pair_name"
async function fetchBuyOrders() {
    if (checkConnected()) {
        let name = document.querySelector(id_fetch_buy_orders_pair_name).innerHTML;
        if (name == "Choose me right here") return undefined;
        var buy_orders = await contract.methods.fetchBuyOrders(name).call();
        return buy_orders;
    }
    return [];
}

let id_fetch_sell_orders_pair_name = "#pair_name"
async function fetchSellOrders() {
    if (checkConnected()) {
        let name = document.querySelector(id_fetch_sell_orders_pair_name).innerHTML;
        if (name == "Choose me right here") return undefined;
        var buy_orders = await contract.methods.fetchSellOrders(name).call();
        return buy_orders;
    }
    return [];
}



let id_order_pair_name = "#pair_name"

let id_buy_market_amount = "#buy_market_amount"
async function buyOrderMarket() {
    if (checkConnected()) {
        let name = document.querySelector(id_order_pair_name).innerHTML;
        let amount = document.querySelector(id_buy_market_amount).value;
        if (!name || !amount) return false
        contract.methods.buyOrderMarket(name, amount).send({from: account})
            .then(async () => {alert('OK!');})
            .catch((err) => {alert(err.stack)});
    }
}

let id_buy_limit_amount = "#buy_limit_amount"
let id_buy_limit_price = "#buy_limit_price"
async function buyOrderLimit() {
    if (checkConnected()) {
        let name = document.querySelector(id_order_pair_name).innerHTML;
        let amount = document.querySelector(id_buy_limit_amount).value;
        let price = document.querySelector(id_buy_limit_price).value;
        if (!name || !amount || !price) return false
        price = await priceEncode(price);
        if (price == "NaN") return undefined;
        contract.methods.buyOrderLimit(name, amount, price).send({from: account})
            .then(async () => {alert('OK!');})
            .catch((err) => {alert(err.stack)});
    }
}

let id_sell_market_amount = "#sell_market_amount"
async function sellOrderMarket() {
    if (checkConnected()) {
        let name = document.querySelector(id_order_pair_name).innerHTML;
        let amount = document.querySelector(id_sell_market_amount).value;
        if (!name || !amount) return false
        contract.methods.sellOrderMarket(name, amount).send({from: account})
            .then(async () => {alert('OK!');})
            .catch((err) => {alert(err.stack)});
    }
}

let id_sell_limit_amount = "#sell_limit_amount"
let id_sell_limit_price = "#sell_limit_price"
async function sellOrderLimit() {
    if (checkConnected()) {
        let name = document.querySelector(id_order_pair_name).innerHTML;
        let amount = document.querySelector(id_sell_limit_amount).value;
        let price = document.querySelector(id_sell_limit_price).value;
        if (!name || !amount || !price) return false
        price = await priceEncode(price);
        if (price == "NaN") return undefined;
        contract.methods.sellOrderLimit(name, amount, price).send({from: account})
            .then(async () => {alert('OK!');})
            .catch((err) => {alert(err.stack)});
    }
}

let id_del_order_id = "#del_order_id"
async function deleteOrder() {
    if (checkConnected()) {
        let id = document.querySelector(id_del_order_id).value;
        if (!id) return false
        contract.methods.deleteOrder(id).send({from: account})
            .then(async () => {alert('OK!');})
            .catch((err) => {alert(err.stack)});
    }
}



let id_deposit_token = "#deposit_token"
let id_deposit_amount = "#deposit_amount"
async function deposit() {
    if (checkConnected()) {
        let token = document.querySelector(id_deposit_token).value;
        let amount = document.querySelector(id_deposit_amount).value;
    }
}