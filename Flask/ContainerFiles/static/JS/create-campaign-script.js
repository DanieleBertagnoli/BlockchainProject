import { getContract } from "./blockchain-integration-script.js"; // Import the script implementing the blockchain integration

let contract; // DragonBlock smart contract instance
let metamaskAccount; // Ethereum account used by the user
loadContractInfo(); // Load the smart contract information 



/**
  * jQuery document-ready function that attaches a submit event handler to all forms on the page.
  * When a form is submitted, it prevents the default form submission behavior and invokes the checkForm function
  * to validate and process the form data for campaign creation.
*/
$(document).ready(function() 
{
	$("form").submit(function(e) // When the form is submitted
  	{ 
    	e.preventDefault(); // Block the default submission
    	checkForm(); // Check if the form is well-compiled
  	});
});




/**
	* Asynchronously loads contract information and assigns the contract instance
	* and MetaMask account to global variables.
*/
async function loadContractInfo() 
{
	const info = await getContract();
	contract = info[0];
	metamaskAccount = info[1];
}



/**
	* Asynchronous function to validate and process campaign creation form data.
	* Checks if the required form fields are filled, validates input values, and interacts with
	* the smart contract to create a campaign. Notifies the user of success or error messages.
	* @returns {boolean} Returns false to prevent the default form submission.
*/
async function checkForm()
{
	var title = $('#title').val(); // Title of the campaign
    if (!title) // Check if the title has been insert
    {
        createErrorMsg('Please enter the campaign title.');
        return false; // Prevent the form submission
    }

    var description = $('#description').val(); // Description of the campaign
    if (!description) // Check if the description has been insert
    {
        createErrorMsg('Please enter the campaign description.');
        return false; // Prevent the form submission
    }

    var ethLimit = $('#eth-limit').val(); // ETH limit of the campaign
    if (ethLimit < 0.05) // Check if the limit is large as needed
    {
        createErrorMsg('The wei limit must be greater than 0.05 ETH.');
        return false; // Prevent the form submission
    }

    const combactLvl = await contract.methods.getUserCombatLvl(metamaskAccount).call(); // Retrieve the combact level from the smart contract
    if(ethLimit > combactLvl / 10) // Check if the limit is coherent with the combact level
    {
      createErrorMsg("Your combact level is too low for the requested ETH!");
      return false; // Prevent the form submission
    }
    
    var weekDuration = $('#week-duration').val(); // Duration of the campaign
    if (weekDuration < 8) // Check if the campaign duration is large enough
    {
        createErrorMsg('The campaign duration must be at least 8 week.');
        return false; // Prevent the form submission
    }

    const deposit =  ethLimit*0.05; // ETH do be deposited by the user for the campaign creation

    // Create the campaign
    const result = await contract.methods.createCampaign(web3.utils.toWei(ethLimit, 'ether'), weekDuration).send({
    	from: metamaskAccount, 
    	value: web3.utils.toWei(deposit+'', 'ether')
    }); 

    const event = result.events.CampaignCreation; // Get the event thrown by the contract method
    const campaignID = event.returnValues.campaignId; // Get the campaign ID

    // AJAX request to send campaign details to the server
    $.ajax({
      url: '/save-campaign',
      method: 'POST',
      data: 
      {
          title: title,
          description: description,
          id: campaignID
      },
      success: function(response) 
      {
          createSuccessMsg(); // Notify the user of the success
          $('#form')[0].reset(); // Reset the form
      },
      error: function(error) 
      { createErrorMsg(error); } // Notify the user of the error
    });

    return false;
}



/**
	* Creates or updates an error message element based on the provided error message.
	* If the error message element doesn't exist, it creates a new one with the given error message.
	* If it already exists, it updates the content of the existing error message with the new error message.
	* The error message includes an exclamation triangle icon, the provided error message, and a close button.
	* @param {string} errorMsg - The error message to be displayed.
*/
function createErrorMsg(errorMsg) 
{
	var errorAlert = $('#error-alert'); // Check if the error message element already exists

  	if (!errorAlert.length) // If it doesn't exist, create it
  	{
    	var alertHtml = `
      		<div id="error-alert" class="alert alert-danger alert-dismissible fade show" role="alert">
        		<svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
        		<span>${errorMsg}</span>
        		<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      		</div>`;

      	$('.form').before(alertHtml); // Insert the error message element before the form
    }  
    else // If it already exists, update the content
    { errorAlert.find('span').text(errorMsg); }
}



/**
	* Creates a success message element and inserts it before the form if it doesn't already exist.
	* The success message includes a checkmark icon, a success message, and a close button.
	* The message informs the user that the campaign was created successfully.
*/
function createSuccessMsg() 
{
	var successAlert = $('#success-alert'); // Check if the success message element already exists

  	if(!successAlert.length) // If it doesn't exist, create it
  	{
    	var alertHtml = `
      		<div class="alert alert-success alert-dismissible fade show" role="alert">
        		<svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:"><use xlink:href="#check-circle-fill"/></svg>
        		Campaign created successfully!
        		<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      		</div>`;
		$('.form').before(alertHtml); // Insert the success message element before the form
  }
}