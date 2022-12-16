// ids
// let ...

if (!contract_addr || !abi || !chainId) {
    alert("Error! ChainID, ABI or contract address isn't set");
}

var metamaskConnected = false;

let contract = undefined;
let web3 = undefined;
let account = undefined;

function disconnectMetamask() {
    if (metamaskConnected) {
        metamaskConnected = false;
        const bsc_address = document.querySelector("#bsc_address");
        const connect_button = document.querySelector("#connect_button");
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
    const bsc_address = document.querySelector("#bsc_address");
    bsc_address.style.display = '';
    bsc_address.innerHTML = account + " (Connected)";
    metamaskConnected = true;
    const connectButton = document.querySelector("#connect_button");
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
}