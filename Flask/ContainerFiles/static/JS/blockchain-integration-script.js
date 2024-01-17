const web3 = new Web3(Web3.givenProvider || "ws://172.17.0.1:7545");

const contractAddress = '0x05bf2302fCEa80a29FDBA9987aec17646367dAdf'; // Address of the DragonBlock contract
const contractJSON = '/static/ContractsJSON/DragonBlock.json'; // Path of the contract ABI

const oracleAddress = '0xB8597a95A58ac133daE70BB1370E428b82ACf3E1'; // Address of the DragonBlockOracle contract
const oracleJSON = '/static/ContractsJSON/DragonBlockOracle.json'; // Path of the contract ABI


/**
	* Asynchronous function to initialize and retrieve Ethereum smart contract instances
	* and MetaMask account for DragonBlock application.
	* @returns {Promise<Array>} A promise that resolves to an array containing:
	*   - contract: The instance of the DragonBlock smart contract.
	*   - metamaskAccount: The Ethereum address of the MetaMask account used for transactions.
	*   - oracle: The instance of the DragonBlockOracle smart contract for user verification.
*/
export async function getContract() 
{
	try 
  	{
		let contract; // Initialize DragonBlock smart contract
	
		await $.getJSON(contractJSON, function(contractData) 
		{ contract = new web3.eth.Contract(contractData.abi, contractAddress); }) // Create a new instance of the DragonBlock smart contract using its ABI and address
		.catch((error) => { console.error('Error initializing DragonBlock contract:', error); });

		let metamaskAccount = await enableMetaMask(); // Enable MetaMask and get the current account

		let oracle; // Initialize DragonBlockOracle smart contract for user verification
		await $.getJSON(oracleJSON, function(oracleData) 
		{      
	 		oracle = new web3.eth.Contract(oracleData.abi, oracleAddress); // Create a new instance of the DragonBlockOracle smart contract using its ABI and address

	  		// Set up an event listener for UserVerification events
	  		oracle.events.UserVerification()
	  		.on('data', async function(event) 
	  		{
				// Extract information from the event
				const userAddress = event.returnValues[0];
				const requestID = event.returnValues[1];

				try 
				{
		  			// Check if the user is registered through the server endpoint
		  			const result = await $.ajax(
		  			{
						url: '/is-registered',
						method: 'POST',
						contentType: 'application/json',
						data: JSON.stringify({ ethereum_address: userAddress }),
						dataType: 'json'
		  			});

					alert("This small transaction is used to verify a user, please authorize it as is a small contribution for you but a huge help for us! Thank you, the team!")

		  			// Process the result and vote on the Oracle contract accordingly
		  			if (result.success) 
		  			{ await oracle.methods.vote(requestID, true).send({ from: metamaskAccount }); } // User is verified, vote "true" on the Oracle contract
		  			else 
		  			{ await oracle.methods.vote(parseInt(requestID), false).send({ from: metamaskAccount }); } // User verification failed, vote "false" on the Oracle contract
				} 
				catch (error) 
				{ console.error('Error checking user verification:', error); }
	  		})
		.on('error', console.error);
		}).catch((error) => { console.error('Error initializing DragonBlockOracle contract:', error); });

		// Return an array containing the contract, MetaMask account, and Oracle instance
		return [contract, metamaskAccount, oracle];
  	}
  	catch (error) 
  	{
		console.error('Error in getContract function:', error);
		throw error; // Re-throw the error for handling at a higher level if needed
  	}
}


/**
	* Asynchronous function to enable and connect to the MetaMask wallet, retrieving the current Ethereum account.
	* @returns {Promise<string|null>} A promise that resolves to the Ethereum address of the MetaMask account
	* or `null` if MetaMask is not installed or access is denied.
*/
async function enableMetaMask() 
{
  	let metamaskAccount;

  	// Check if MetaMask is installed
  	if (window.ethereum) 
  	{
		try 
		{
	  		window.web3 = new Web3(window.ethereum); // Initialize Web3 with MetaMask's provider
	  		await window.ethereum.request({ method: 'eth_requestAccounts' }); // Request user account access

	  		// Get the list of available accounts and select the first one
	  		var accounts = await web3.eth.getAccounts();
	  		metamaskAccount = accounts[0];

	  		console.log('Connected to MetaMask. Current account:', metamaskAccount); // Log successful connection to MetaMask
		} 
		catch (error) 
		{ console.error('User denied account access or there was an error:', error); }
  	} 
  	else 
  	{ console.error('MetaMask is not installed. Please install MetaMask to use this DApp.'); } // Log an error if MetaMask is not installed

  	// Return the Ethereum address of the MetaMask account or null if not available
  	return metamaskAccount;
}
