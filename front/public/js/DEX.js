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

let PAGE_TYPE = 0

let id_check_market = "#check_market"
let id_check_limit = "#check_limit"
document.addEventListener("DOMContentLoaded", async function() {
    var check_market = document.querySelector(id_check_market);
    if (!check_market) {
        return;
    }
    PAGE_TYPE = 1;
    var check_limit = document.querySelector(id_check_limit);
    var price_input = document.querySelector(id_order_price_input);
    check_market.checked = true;
    check_limit.checked = false;
    price_input.disabled = true;
})

let id_order_price_input = "#order_price_input"
async function checkChange(id) {
    var check_market = document.querySelector(id_check_market);
    var check_limit = document.querySelector(id_check_limit);
    var price_input = document.querySelector(id_order_price_input);
    if (id == 0) {
        check_market.checked = true;
        check_limit.checked = false;
        price_input.disabled = true;
    } else {
        check_market.checked = false;
        check_limit.checked = true;
        price_input.disabled = false;
    }
}

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
    if (PAGE_TYPE == 1) {
        // if users
        await listOrders();
    }
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

let MAX_ORDERS = 10;
let id_order_list = "#order_list"
async function listOrders() {
    if (document.querySelector("#pair_name").innerHTML=="Choose me right here") {
        alert("Choose pair first!");
        return;
    }
    var buy_orders = await fetchBuyOrders();
    var sell_orders = await fetchSellOrders();
    sell_orders = sell_orders.slice(-MAX_ORDERS);
    buy_orders = buy_orders.slice(-MAX_ORDERS).reverse();

    html = ''
    for (var i = 0; i < sell_orders.length; i++) {
        html += `<div class="row">
        <div class="bottom-column" style="width: 15%">${sell_orders[i].id}</div>
        <div class="bottom-column" style="width: 25%">${sell_orders[i].creator}</div>
        <div class="bottom-column">${await priceDecode(sell_orders[i].price)}</div>
        <div class="bottom-column">${sell_orders[i].amount}</div>
        <div class="bottom-column sell">Sell</div>
      </div>`
    }

    for (var i = 0; i < buy_orders.length; i++) {
        html += `<div class="row">
        <div class="bottom-column" style="width: 15%">${buy_orders[i].id}</div>
        <div class="bottom-column" style="width: 25%">${buy_orders[i].creator}</div>
        <div class="bottom-column">${await priceDecode(buy_orders[i].price)}</div>
        <div class="bottom-column">${buy_orders[i].amount}</div>
        <div class="bottom-column buy">Buy</div>
      </div>`
    }
    document.querySelector(id_order_list).innerHTML = html;
}

async function processBuyOrder() {
    if (document.querySelector("#pair_name").innerHTML=="Choose me right here") {
        alert("Choose pair first!");
        return;
    }
    var check_market = document.querySelector(id_check_market);
    var check_limit = document.querySelector(id_check_limit);
    if (check_market.checked) {
        await buyOrderMarket();
    }
    else if (check_limit.checked) {
        await buyOrderLimit();
    }
    await listOrders();
}

async function processSellOrder() {
    if (document.querySelector("#pair_name").innerHTML=="Choose me right here") {
        alert("Choose pair first!");
        return;
    }
    var check_market = document.querySelector(id_check_market);
    var check_limit = document.querySelector(id_check_limit);
    if (check_market.checked) {
        await sellOrderMarket();
    } 
    else if (check_limit.checked) {
        await sellOrderLimit();
    }
    await listOrders();
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

let id_buy_market_amount = "#order_amount"
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

let id_buy_limit_amount = "#order_amount"
let id_buy_limit_price = "#order_price_input"
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

let id_sell_market_amount = "#order_amount"
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

let id_sell_limit_amount = "#order_amount"
let id_sell_limit_price = "#order_price_input"
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



let id_token = "#token"
let id_amount = "#amount"

async function deposit() {
    if (checkConnected()) {
        let token = document.querySelector(id_token).value;
        let amount = document.querySelector(id_amount).value;
        if (!token || !amount) return undefined
        let erc20 = new web3.eth.Contract(abi_erc20, token);
        erc20.methods.approve(contract_addr, amount).send({from: account})
        .then(() => {contract.methods.deposit(token, amount).send({from: account})
            .then(async () => {alert('OK!');})
            .catch((err) => {alert(err.stack)})})
        .catch((err) => {alert(err.stack)});
    }
}

async function withdraw() {
    if (checkConnected()) {
        let token = document.querySelector(id_token).value;
        let amount = document.querySelector(id_amount).value;
        if (!token || !amount) return undefined
        contract.methods.withdraw(token, amount).send({from: account})
            .then(async () => {alert('OK!');})
            .catch((err) => {alert(err.stack)});
    }
}

async function balanceOf() {
    if (checkConnected()) {
        let token = document.querySelector(id_token).value;
        if (!token) return undefined
        let balance = await contract.methods.balanceOf(token, account).call();
        document.querySelector("#token_balance").innerHTML = balance;
    }
}