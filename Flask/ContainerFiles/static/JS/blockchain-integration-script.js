const web3 = new Web3(Web3.givenProvider || "ws://172.17.0.1:7545");

// Specify the address of your deployed smart contract
const contractAddress = '0x3FD241aeE6Fc04d898f4f2b3fCC838A2b19f6949'; // Replace with the actual address
const contractJSON = '/static/ContractsJSON/DragonBlock.json';

export async function getContract() {
    let contract;
    await $.getJSON(contractJSON, function(contractData)
    {
      contract = new web3.eth.Contract(contractData.abi, contractAddress);
    }).catch((error) => { console.error(error); });

    let metamaskAccount = await enableMetaMask();

    return [contract, metamaskAccount];
}

async function enableMetaMask() {
    let metamaskAccount;

    if (window.ethereum) {
      try {
        window.web3 = new Web3(window.ethereum);
  
        // Request account access using the new method
        await window.ethereum.request({ method: 'eth_requestAccounts' });
  
        var accounts = await web3.eth.getAccounts();
        metamaskAccount = accounts[0];
        console.log('Connected to MetaMask');
      } catch (error) {
        console.error('User denied account access or there was an error:', error);
      }
    } else {
      console.error('MetaMask is not installed. Please install MetaMask to use this DApp.');
    }

    return metamaskAccount;
}