import { getContract } from "./blockchain-integration-script.js"; // Import the script implementing the blockchain integration

let contract; // DragonBlock smart contract instance
let metamaskAccount; // Ethereum account used by the user



/**
 	* jQuery document-ready function that initializes contract information.
*/
$(document).ready(function() 
{ loadContractInfo(); }); // Call the function to load contract information



/**
	* Asynchronously loads contract information and assigns the contract instance
	* and MetaMask account to global variables.
*/
async function loadContractInfo() 
{
    const info = await getContract();
    contract = info[0];
    metamaskAccount = info[1];

	loadCampaigns(); // Load campaigns
}



/**
	* Asynchronously loads campaigns from the blockchain and fetches additional details from the server.
*/
async function loadCampaigns() 
{
	const campaigns = await contract.methods.getOwnedCampaigns(metamaskAccount).call(); // Get owned campaigns from the blockchain using the contract method
  
	const campaignIds = campaigns.map(campaign => campaign.id); // Extract campaign IDs from the obtained campaigns
  
	// Fetch additional details from the server using a POST request
	const response = await fetch('/get-campaigns', 
	{
	  	method: 'POST',
	  	headers: { 'Content-Type': 'application/json', },
	  	body: JSON.stringify({ campaign_ids: campaignIds }),
	});
  
	// Check if the server response is successful
	if (response.ok) 
	{
	  	// Parse the JSON response containing titles and descriptions
	  	const titlesDescriptions = await response.json();
  
	  	// Iterate through the obtained campaigns
	  	for (let i = 0; i < campaigns.length; i++) 
		{
			// Extract relevant information for each campaign
			let title = titlesDescriptions[i]["title"];
			let description = titlesDescriptions[i]["description"];
			let start = convertUnixTimestamp(campaigns[i]["creationTime"]);
			let weeksUnix = campaigns[i]["weekDuration"] * 7 * 24 * 60 * 60;
			let end = convertUnixTimestamp(parseInt(campaigns[i]["creationTime"]) + parseInt(weeksUnix));
			let limit = web3.utils.fromWei(campaigns[i]["weiLimit"], 'ether');
			let donated = web3.utils.fromWei(campaigns[i]["donatedWei"], 'ether');
			let id = titlesDescriptions[i]["id"];
			let status = getStatusString(campaigns[i]["status"]);
			let revision = convertUnixTimestamp(campaigns[i]["revisionTime"]);
  
			createCampaign(title, description, start, end, limit, donated, id, status, revision); // Create a campaign element with the extracted information
	  	}
	} 
}
  


/**
	* Dynamically creates HTML elements to display campaign information on the webpage.
	* Handles different states of campaigns and includes action buttons for finalizing, terminating, and finalizing revisions.
	* @param {string} title - The title of the campaign.
	* @param {string} description - The description of the campaign.
	* @param {string} start - The start date of the campaign.
	* @param {string} end - The end date of the campaign.
	* @param {string} limit - The donation limit of the campaign.
	* @param {string} donated - The amount donated to the campaign.
	* @param {string} id - The ID of the campaign.
	* @param {string} status - The status of the campaign ('Pending', 'Revision', 'Active', 'Ended', 'Disapproved', 'Banned').
	* @param {string} revision - The revision time of the campaign (applicable for 'Revision' status).
*/
function createCampaign(title, description, start, end, limit, donated, id, status, revision) 
{
    let newCampaign;
    if(status == 'Pending')
	{
      	newCampaign = $(
        	'<div class="single-campaign">' +
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
        	'<button class="btn-custom btn-approve" id="btn-finalize" data-id="' + id + '"><span>Finalize</span><i class="bi bi-hand-thumbs-up-fill"></i></button>' +
        	'</div>' +
        	'</div>' +
        	'</div>'
      	);

        const startDate = new Date(start);
        const sevenDaysLater = new Date(startDate);
        sevenDaysLater.setDate(startDate.getDate() + 0);
    
        if (startDate < sevenDaysLater) // If the campaign has been published more than 7 days ago
		{ newCampaign.find('.btn-approve').hide(); } // Hide the approve button

        $('#pending-campaigns').append(newCampaign); // Append the campaign
    }
    else if(status == 'Revision')
	{
        newCampaign = $(
        	'<div class="single-campaign">' +
        	'<div class="campaign-header">' +
        	'<h2>' + title + '</h2>' +
        	'<h2>' + start + ' : ' + end + ' <i class="bi bi-calendar-fill"></i></h2>' +
        	'</div>' +
        	'<h2>' + status + ' from: ' + revision + '</h2>' +
        	'<div class="campaign-description">' +
        	'<p>' + description + '</p>' +
        	'</div>' +
        	'<div class="buttons buttons-campaigns">' +
        	'<div class="btn-wrapper">' +
        	'<button class="btn-custom btn-approve" id="btn-finalize-revision" data-id="' + id + '"><span>Finalize</span><i class="bi bi-hand-thumbs-up-fill"></i></button>' +
        	'</div>' +
        	'</div>' +
        	'</div>'
        );
  
        const revisionDate = new Date(revision);
        const sevenDaysLater = new Date(revisionDate);
        sevenDaysLater.setDate(revisionDate.getDate() + 0);
      
        if (revisionDate < sevenDaysLater) // If the campaign has been put in revision more than 7 days ago
		{ newCampaign.find('.btn-approve').hide(); } // Hide the approve button
  
        $('#pending-campaigns').append(newCampaign); // Append the campaign
    }
    else if(status == 'Active')
	{
      	newCampaign = $(
        	'<div class="single-campaign">' +
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
        	'<div class="buttons buttons-campaigns">' +
        	'<div class="btn-wrapper">' +
        	'<button class="btn-custom btn-approve" id="btn-end" data-id="' + id + '"><span>End</span><i class="bi bi-hand-thumbs-up-fill"></i></button>' +
        	'</div>' +
        	'</div>' +
        	'</div>'
      	);

        $('#active-campaigns').append(newCampaign); // Append the campaign
    }
    else if(status == 'Ended')
	{
    	newCampaign = $(
        	'<div class="single-campaign">' +
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

        $('#ended-campaigns').append(newCampaign); // Append the campaign
    }
    else if(status == 'Disapproved' || status == 'Banned')
	{
    	newCampaign = $(
        	'<div class="single-campaign">' +
        	'<div class="campaign-header">' +
        	'<h2>' + title + '</h2>' +
        	'</div>' +
        	'<h2>' + status + '</h2>' +
        	'<div class="campaign-description">' +
        	'<p>' + description + '</p>' +
        	'</div>' +
        	'</div>'
      	);

        $('#ended-campaigns').append(newCampaign); // Append the campaign
    }
  
	// Event handler for the 'Finalize' button
    newCampaign.find('#btn-finalize').on('click', async function() 
	{
    	const campaignId = $(this).data('id');
    	try 
		{ await contract.methods.finalizeCampaign(campaignId).send({from: metamaskAccount}); } // Call the finalize method in the contract for finalizing a pending campaign
		catch (error) 
		{ displayError(error); }
    });
  
	// Event handler for the 'End' button
    newCampaign.find('#btn-end').on('click', async function() 
	{
        const campaignId = $(this).data('id');
        try 
		{ await contract.methods.terminateCampaign(campaignId).send({from: metamaskAccount}); } // Call the terminate method in the contract for terminating a pending campaign
		catch (error) 
		{ displayError(error); }
    });
  
	// Event handler for the 'Finalize' button
    newCampaign.find('#btn-finalize-revision').on('click', async function() 
	{
		const campaignId = $(this).data('id');
      	try 
		{ await contract.methods.finalizeRevisionCampaign(campaignId).send({from: metamaskAccount}); } // Call the finalize method in the contract for finalizing a revision campaign
		catch (error) 
		{ displayError(error); }
    });
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



/**
	* Displays error messages using the alert function.
	* @param {Error} error - The error object to be displayed.
*/
function displayError(error) 
{
    let errorMessage;

    // Check if the error message contains 'revert'
    if (error.message.includes('revert')) 
	{ errorMessage = error.message.split('Reason given: ')[1]; } 
	else 
	{ errorMessage = error.message; }

    alert('Error: ' + errorMessage);
}
