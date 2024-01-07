import { getContract } from "./blockchain-integration-script.js"; // Import the script implementing the blockchain integration

let contract; // DragonBlock smart contract instance
let metamaskAccount; // Ethereum account used by the user
loadContractInfo(); // Load the smart contract information 



/**
	* Executes the provided function when the DOM (Document Object Model) is fully loaded.
	* Attaches a submit event listener to the form with the ID "form".
	* Calls the asynchronous function `checkForm` to validate the form before submission.
	* Prevents the default form submission if the validation fails.
*/
$(document).ready(function() 
{
    $("#form").submit(async function(e) 
    {
    	const formType = $("#form").data('form-type'); // Get the form type data attribute value
    	const validationResult = await checkForm(formType); // Call the asynchronous function to validate the form
  
    	if (!validationResult) // Prevent the default form submission if the validation fails
    	{ e.preventDefault(); }
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
	* Validates form inputs based on the specified form type.
	* Displays error messages for invalid inputs and prevents form submission.
	* @param {string} formType - The type of the form to be validated ('signup', 'login').
	* @returns {Promise<boolean>} - A Promise that resolves to true if the form is valid, and false otherwise.
*/
window.checkForm = function (formType) { checkForm(formType); } // Used to expose the method in the HTML
async function checkForm(formType) 
{
    var email = $('#email').val(); // User emai;
    if (!email) // Check if the mail has been insert 
    {
    	createErrorMsg('Please enter your email.');
    	return false; // Prevent the form submission
    }
  
    var password = $('#password').val(); // User password
  
    if (formType == 'signup') // If is the signup form
    {
    	var passwordConfirm = $('#password-confirm').val(); // Password confirm
    	var username = $('#username').val(); // Username
    	var birthday = $('#birthday').val(); // User birthday
    	var ethereumAddress = $('#ethereum-address').val(); // User ethereum address
  
      	if(!username) // Check if the username has been insert
      	{
        	createErrorMsg('Please enter your username.');
        	return false; // Prevent the form submission
      	}
  
      	if(!birthday) // Check if the birthday has been insert
      	{
        	createErrorMsg('Please enter your date of birth.');
        	return false; // Prevent the form submission
      	}
  
      	if(!ethereumAddress) // Check if the ethereum address has been insert
      	{
        	createErrorMsg('Please enter your Ethereum address.');
        	return false; // Prevent the form submission
      	}

      	// Check if the user is at least 18 years old
      	var today = new Date();
      	var birthDate = new Date(birthday);
      	var age = today.getFullYear() - birthDate.getFullYear();

      	if(age < 18)
      	{
        	createErrorMsg('You must be at least 18 years old.');
        	return false; // Prevent the form submission
      	}
  
      	if(!password || !passwordConfirm) // Check if both of the two passwords have been insert  
      	{
        	createErrorMsg('Please enter both password fields.');
        	return false; // Prevent the form submission
      	}
  
      	if(password !== passwordConfirm) // CHeck if the passwords coincide
      	{
        	createErrorMsg('Passwords do not match.');
        	return false; // Prevent the form submission
      	}
    } 
    else if(formType == 'login') // It is a login form
    {
      	if(!password) // Check if the password has been insert
      	{
        	createErrorMsg('Please enter your password.');
        	return false; // Prevent the form submission
      	}
  
      	const res = await contract.methods.verifiedUsers(metamaskAccount).call(); // Check if the user has already been verified
      	if(!res) // If the user has not been verified yet
      	{ await contract.methods.verifyUser().send({ from: metamaskAccount }); } // Ask for verification
    } 
    else // Wrong form type
    { return false; }
  
    return true;
}
  


/**
	* Displays an error message on the webpage using a Bootstrap alert.
	* If the error message element already exists, updates its content; otherwise, creates a new alert.
	* @param {string} errorMsg - The error message to be displayed.
*/
function createErrorMsg(errorMsg) 
{
    var errorAlert = $('#error-alert'); // Check if the error message element already exists

    if (!errorAlert.length) // If it doesn't exist, create a new alert
	{
        // HTML structure for the error message alert
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