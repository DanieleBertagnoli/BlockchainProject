import { getContract } from "./blockchain-integration-script.js"; // Import the script implementing the blockchain integration

let campaignWindow = 1; // Variable to keep track of the campaign window already generated

let contract; // DragonBlock smart contract instance
let metamaskAccount; // Ethereum account used by the user



/**
 	* jQuery document-ready function that initializes contract information.
 */
$(document).ready(function() 
{ loadContractInfo(); }); // Call the function to load contract information



/**
	* Asynchronously loads contract information, user role, and campaign window details.
 	* Updates the displayed DST balance for the user.
 	* Adjusts UI elements based on the user's DST balance and SSJ status.
 	* Displays appropriate buttons and information for SSJ or NormalUser roles.
*/
async function loadContractInfo() 
{
	const info = await getContract(); // Get contract information and user account from the getContract function
	contract = info[0];
	metamaskAccount = info[1];

  	const dstBalance = await contract.methods.dstBalances(metamaskAccount).call(); // Get the current user's DST balance
  	$('#dst-amount').text(dstBalance); // Update the HTML element

  	if(dstBalance < 500) // If the balance is lower than 500 hide the buttons 
  	{ 
  	  $('#become-ssj').hide(); 
  	  $('#exit-ssj').hide();
  	}

  	await loadCampaignWindow(); // Create the campaigns

  	const vault = await contract.methods.ssjVaults(metamaskAccount).call(); // Get the current user's vault
	console.log(vault);
	if(vault > 0) // If the user is a SSJ (the vault is greater than 0)
	{ 
		$('#user-role').text('SSJ, Vault:' + web3.utils.fromWei(vault, 'ether') + ' ETH'); 
		$('#exit-ssj').show();
		$('#become-ssj').hide();
		$('.btn-approve').show();
		$('.btn-disapprove').show(); 
	}
	else
	{ 
		$('#user-role').text('NormalUser'); 
		$('.btn-approve').hide();
		$('.btn-disapprove').hide(); 
		$('#become-ssj').show();
		$('#exit-ssj').hide();
	}
}



/**
 	* Asynchronously loads campaign details from the blockchain and the server for the current campaign window.
 	* Retrieves campaign data from the smart contract and fetches additional details from the server.
 	* Dynamically creates and displays campaign elements using the createCampaign function.
 	* Updates the campaign window index for the next load.
*/
window.loadCampaignWindow = function () { loadCampaignWindow(); } // Used to expose the method in the HTML
async function loadCampaignWindow()
{
  	const campaigns = await contract.methods.getCampaigns(campaignWindow).call(); // Get a subset of the campaigns
  	campaignWindow++; // Next window

  	if(campaigns.length == 0) // There are no campaigns
  	{ return; }
  
  	const campaignIDs = campaigns.map(campaign => campaign.id); // Get the campaign IDs

  	// Get additional information from the database about the retrieved campaigns
  	const response = await fetch('/get-campaigns', 
  	{
  		method: 'POST',
  		headers: { 'Content-Type': 'application/json', },
  		body: JSON.stringify({ campaign_ids: campaignIDs }),
  	});

  	if (response.ok) // The server has answered without errors
  	{
  		const titlesDescriptions = await response.json(); // Retrieve the titles and the descriptions

  	  	for (let i = 0; i < campaigns.length; i++) // Create the campaigns elements
  	  	{
  	    	let title = titlesDescriptions[i]["title"];
  	    	let description = titlesDescriptions[i]["description"];
  	    	let start = convertUnixTimestamp(campaigns[i]["creationTime"]);
  	    	let weeksUnix = campaigns[i]["weekDuration"] * 7 * 24 * 60 * 60;
  	    	let end = convertUnixTimestamp(parseInt(campaigns[i]["creationTime"]) + parseInt(weeksUnix));
  	    	let limit = web3.utils.fromWei(campaigns[i]["weiLimit"], 'ether');
  	    	let donated = web3.utils.fromWei(campaigns[i]["donatedWei"], 'ether');
  	    	let id = titlesDescriptions[i]["id"];
  	    	let status = getStatusString(campaigns[i]["status"]);
  	    	createCampaign(title, description, start, end, limit, donated, id, status);
  	  	}
  	} 
}



/**
 	* Dynamically creates and displays a campaign element based on the provided details.
 	* Attaches appropriate event listeners for buttons within the campaign element.
 	* Handles different statuses by adjusting the displayed content and buttons accordingly.
 	* @param {string} title - The title of the campaign.
 	* @param {string} description - The description of the campaign.
 	* @param {string} start - The start date of the campaign.
 	* @param {string} end - The end date of the campaign.
 	* @param {string} limit - The ETH donation limit for the campaign.
 	* @param {string} donated - The amount of ETH already donated to the campaign.
 	* @param {string} id - The identifier of the campaign.
 	* @param {string} status - The status of the campaign (e.g., 'Pending', 'Active', 'Ended', 'Disapproved', 'Banned').
*/
function createCampaign(title, description, start, end, limit, donated, id, status) 
{
	let newCampaign;
  	if(status == 'Pending' || status == 'Revision')
	{
    	newCampaign = $(
    		'<div class="single-campaign" id=' + id + '>' +
    		'<div class="campaign-header">' +
    		'<h2>' + title + '</h2>' +
    		'<h2>' + start + ' : ' + end + ' <i class="bi bi-calendar-fill"></i></h2>' +
    		'</div>' +
    		'<h2>' + status + '</h2>' +
    		'<div class="campaign-description">' +
    		'<p>' + description + '</p>' +
    		'</div>' +
    		'<div class="buttons buttons-campaigns">' +
    		'<div class="btn-wrapper">' +
    		'<button class="btn-custom btn-approve" data-id="' + id + '" data-status="' + status + '"><span>Approve</span><i class="bi bi-hand-thumbs-up-fill"></i></button>' +
    		'</div>' +
    		'<div class="btn-wrapper">' +
    		'<button class="btn-custom btn-disapprove" data-id="' + id + '" data-status="' + status + '"><span>Disapprove</span><i class="bi bi-hand-thumbs-down-fill"></i></button>' +
    		'</div>' +
    		'</div>' +
    		'</div>'
    	);
  	}
	else if(status == 'Active')
  	{
		newCampaign = $(
			'<div class="single-campaign" id=' + id + '>' +
			'<div class="campaign-header">' +
			'<h2>' + title + '</h2>' +
			'<h2>' + start + ' : ' + end + ' <i class="bi bi-calendar-fill"></i></h2>' +
			'</div>' +
			'<h2>' + status + '</h2>' +
			'<div class="campaign-description">' +
			'<p>' + description + '</p>' +
			'</div>' +
			'<div class="donated-eth">' +
			'<h3>' + donated + ' / ' + limit + ' ETH</h3>' +
			'</div>' +
			'<div class="buttons buttons-campaigns">' +
			'<div class="btn-wrapper">' +
			'<button class="btn-custom btn-donate" data-id="' + id + '"><span>Donate</span><i class="bi bi-piggy-bank-fill"></i></button>' +
			'</div>' +
			'<div class="btn-wrapper">' +
			'<button class="btn-custom btn-report" data-id="' + id + '"><span>Report</span><i class="bi bi-flag-fill"></i></button>' +
			'</div>' +
			'</div>' +
			'</div>'
		);
  	}
  	else if(status == 'Ended')
	{
    	newCampaign = $(
    		'<div class="single-campaign" id=' + id + '>' +
    		'<div class="campaign-header">' +
    		'<h2>' + title + '</h2>' +
    		'<h2>' + start + ' : ' + end + ' <i class="bi bi-calendar-fill"></i></h2>' +
    		'</div>' +
    		'<h2>' + status + '</h2>' +
    		'<div class="campaign-description">' +
    		'<p>' + description + '</p>' +
    		'</div>' +
    		'<div class="donated-wei">' +
    		'<h3>' + donated + ' / ' + limit + ' ETH</h3>' +
    		'</div>' +
    		'</div>'
    	);
  }
  else if(status == 'Disapproved' || status == 'Banned')
  {
    	newCampaign = $(
    		'<div class="single-campaign" id=' + id + '>' +
    		'<div class="campaign-header">' +
    		'<h2>' + title + '</h2>' +
    		'</div>' +
    		'<h2>' + status + '</h2>' +
    		'<div class="campaign-description">' +
    		'<p>' + description + '</p>' +
    		'</div>' +
    		'</div>'
    	);
  }

	// Attach event listener for the "Donate" button
  	newCampaign.find('.btn-donate').on('click', function () 
  	{
    	const campaignID = $(this).data('id');
    	promptDonation(campaignID);
  	});

  	// Attach event listener for the "Report" button
  	newCampaign.find('.btn-report').on('click', function () 
  	{
    	const campaignID = $(this).data('id');
    	reportCampaign(campaignID);
  	});

  	// Attach event listener for the "Approve" button
  	newCampaign.find('.btn-approve').on('click', function () 
  	{
    	const campaignID = $(this).data('id');
    	const campaignStatus = $(this).data('status');
    	voteForCampaign(campaignID, true, campaignStatus);
  	});

  	// Attach event listener for the "Disapprove" button
  	newCampaign.find('.btn-disapprove').on('click', function () 
  	{
    	const campaignID = $(this).data('id');
    	const campaignStatus = $(this).data('status');
    	voteForCampaign(campaignID, false, campaignStatus);
  	});

  	const startDate = new Date(start);

  	// Calculate the date after 7 days
  	const sevenDaysAfterStart = new Date(startDate);
  	sevenDaysAfterStart.setDate(startDate.getDate() + 0);

  	// Check if the current date is more than 7 days after the start date
  	const currentDate = new Date();
  	if (currentDate > sevenDaysAfterStart) // If more than 7 days have passed, hide the approval/disapproval buttons
  	{ newCampaign.find('.btn-approve, .btn-disapprove').hide(); }

  	$('#btn-more').before(newCampaign); // Insert the new campaign before the "Load More" button
}



/**
 	* Prompts the user for a donation amount and processes the donation for a specific campaign.
 	* The function retrieves campaign details from the campaign element identified by the given campaignID.
 	* It checks if the campaign has ended and prompts the user for the donation amount.
 	* Validates the donation amount for correctness and ensures it aligns with step requirements.
 	* Alerts the user about the success or failure of the donation.
 	* @param {string} campaignID - The identifier of the campaign element.
*/
function promptDonation(campaignID) 
{
	const campaignElement = $('#' + campaignID); // Get the campaign element

  	// Extract the end date from the campaign element
  	const endDateText = campaignElement.find('.campaign-header h2:last-child').text().split(' : ')[1];
  	const endDate = new Date(endDateText);

  	const currentDate = new Date();
  	if (currentDate > endDate) // Check if the current date is after the end date
  	{
  		alert('This campaign has ended.');
  		return;
  	}

  	// Extract the donated and limit values from the campaign element
  	const donatedText = campaignElement.find('.donated-eth h3').text().split(' / ');
  	const donated = parseFloat(donatedText[0]);
  	const limit = parseFloat(donatedText[1].replace('ETH', ''));

  	const donatedEth = parseFloat(prompt('Enter the number of donated ETH (step of 0.0005):')); // Prompt for donation amount

  	if (donatedEth == null || (donatedEth * 1000) % (0.0005 * 1000) != 0) // Check if the insert donation amount is correct
  	{
  		alert('You can donate only with steps of 0.0005 ETH');
  		return;
  	}

  	if (donated + donatedEth > limit) // Check if the insert donation amount exceeds the donation limit
  	{
  		alert('Donation exceeds the campaign limit.');
  		return;
  	}

  	donateCampaign(campaignID, donatedEth + ''); // Donate to the campaign
}



/**
	* Votes for or against a campaign based on the provided parameters.
	* If the campaign status is "Pending" or "Revision," it calls the corresponding contract method
	* to submit the vote. Displays an alert to inform the user about the success or failure of the vote.
	* @param {string} campaignID - The identifier of the campaign.
	* @param {boolean} approval - True if voting for the campaign, false if voting against.
	* @param {string} campaignStatus - The status of the campaign (e.g., 'Pending', 'Revision').
*/
async function voteForCampaign(campaignID, approval, campaignStatus) 
{
  	if(campaignStatus == "Pending") 
  	{
  	  	try 
  	  	{
  	  		await contract.methods.voteForCampaign(campaignID, approval).send({from: metamaskAccount}); // Send the vote for the pending campaign
  	  		alert('Vote sent!');
  	  	} 
  	  	catch(e) 
  	  	{ alert('You have already voted for this campaign'); }
  	}
  	else if (campaignStatus == "Revision") 
  	{
  		try 
  		{
  			await contract.methods.revisionCampaign(campaignID, approval).send({from: metamaskAccount}); // Send the vote for the campaign in revision
  			alert('Vote sent!');
  		} 
  		catch(e) 
  		{ alert('You have already voted for this campaign'); }
  	}
}



/**
	* Asynchronously triggers the process for a user to exit the SSJ (Super Saiyan) role.
	* Calls the smart contract method to transition the user to a NormalUser.
	* Updates UI elements to reflect the change in user role.
*/
window.exitSSJ = function() { exitSSJ(); }; // Used to expose the method in the HTML
async function exitSSJ() 
{
	try 
	{
		await contract.methods.becomeNormalUser().send({ from: metamaskAccount }); // Call the smart contract method to transition the user to a NormalUser	
		// Update UI elements to reflect the change in user role
		$('#user-role').text('NormalUser');
		$('.btn-approve').hide();
		$('.btn-disapprove').hide();
		$('#become-ssj').show();
		$('#exit-ssj').hide();
	} 
	catch (error) 
	{ alert('Error exiting SSJ:', error); }
}



/**
	* Asynchronously triggers the process for a user to become an SSJ (Super Saiyan).
	* Calls the smart contract method to transition the user to an SSJ by sending 0.5 ETH as a deposit.
	* Retrieves the updated SSJ vault balance and updates UI elements to reflect the change in user role.
*/
window.becomeSSJ = function() { becomeSSJ(); }; // Used to expose the method in the HTML
async function becomeSSJ() 
{
	try 
	{
    	await contract.methods.becomeSSJ().send({ from: metamaskAccount, value: web3.utils.toWei('0.5', 'ether') }); // Call the smart contract method to transition the user to an SSJ, sending 0.5 ETH as a deposit
    	const vault = await contract.methods.ssjVaults(metamaskAccount).call(); // Retrieve the updated SSJ vault balance for the user

    	// Update UI elements based on the SSJ status and vault balance
    	if (vault > 0) 
    	{
      		$('#user-role').text('SSJ, Vault: ' + web3.utils.fromWei(vault, 'ether') + ' ETH');
      		$('#exit-ssj').show();
      		$('#become-ssj').hide();
      		$('.btn-approve').show();
      		$('.btn-disapprove').show();
    	} 
    	else 
    	{
      		$('#user-role').text('NormalUser');
      		$('.btn-approve').hide();
      		$('.btn-disapprove').hide();
      		$('#become-ssj').show();
      		$('#exit-ssj').hide();
    	}
  	} 
  	catch (error) 
  	{ alert('Error becoming SSJ:', error); }
}



/**
	* Asynchronously reports a campaign, deducting 1 DST from the user's balance.
	* Calls the smart contract method to report the specified campaign.
	* Updates the displayed DST balance in the UI.
	* Displays an alert message to inform the user about the success of the report.
	* @param {string} id - The identifier of the campaign to be reported.
*/
async function reportCampaign(id) 
{
	try 
  	{
    	if ($('#dst-amount').text() == 0) // Check if the user has enough DST to report the campaign 
    	{ alert('You don\'t have enough DST!'); } 
    	else 
    	{
      		await contract.methods.reportCampaign(id).send({ from: metamaskAccount }); // Call the smart contract method to report the specified campaign
      		const dstBalance = await contract.methods.dstBalances(metamaskAccount).call(); // Retrieve the updated DST balance for the user
      		$('#dst-amount').text(dstBalance); // Update the displayed DST balance in the UI
      		alert('Campaign reported! 1 DST removed'); // Display an alert message to inform the user about the success of the report
    	}
  	} 
	catch (error) 
	{ alert('Error reporting campaign:', error); }
}



/**
	* Asynchronously donates ETH to a specified campaign, updating the user's DST balance.
	* Calls the smart contract method to donate ETH to the specified campaign.
	* Retrieves the updated DST balance for the user.
	* Updates the displayed DST balance in the UI.
	* Displays an alert message to inform the user about the completion of the donation.
	* @param {string} id - The identifier of the campaign to which the donation is made.
	* @param {string} donatedEth - The amount of ETH to be donated to the campaign.
*/
async function donateCampaign(id, donatedEth) 
{
	try 
  	{
    	await contract.methods.donateCampaign(id).send({ from: metamaskAccount, value: web3.utils.toWei(donatedEth, 'ether') }); // Call the smart contract method to donate ETH to the specified campaign
    	const dstBalance = await contract.methods.dstBalances(metamaskAccount).call(); // Retrieve the updated DST balance for the user
    	$('#dst-amount').text(dstBalance); // Update the displayed DST balance in the UI
    	alert('Donation completed!'); // Display an alert message to inform the user about the completion of the donation
  	} 
  	catch (error) 
  	{ alert('Error donating to campaign:', error); }
}



/**
	* Converts a Unix timestamp to a formatted date string (YYYY/MM/DD).
	* @param {number} unixTimestamp - The Unix timestamp to be converted (in seconds).
	* @returns {string} - The formatted date string in the format YYYY/MM/DD.
*/
function convertUnixTimestamp(unixTimestamp) 
{
	const date = new Date(unixTimestamp * 1000); // Create a new Date object with the provided Unix timestamp (in milliseconds)

  	// Extract the various components of the date
  	const year = date.getFullYear();
  	const month = ('0' + (date.getMonth() + 1)).slice(-2); // Month is zero-based, so add 1
  	const day = ('0' + date.getDate()).slice(-2);

  	const formattedDate = `${year}/${month}/${day}`; // Create a formatted date string
  	return formattedDate;
}



/**
	* Converts a numerical campaign status code to its corresponding string representation.
	* @param {string} status - The numerical campaign status code to be converted.
	* @returns {string} - The string representation of the campaign status.
*/
function getStatusString(status) 
{
  	switch (status) 
  	{
    	case "0": // CampaignStatus.PENDING
    	  	return "Pending";
    	case "1": // CampaignStatus.ACTIVE
    	  	return "Active";
    	case "2": // CampaignStatus.DISAPPROVED
    	  	return "Disapproved";
    	case "3": // CampaignStatus.REVISION
    	  	return "Revision";
    	case "4": // CampaignStatus.BANNED
    	  	return "Banned";
    	case "5": // CampaignStatus.ENDED
    	  	return "Ended";
    	default:
    	  	return "Unknown";
	}
}