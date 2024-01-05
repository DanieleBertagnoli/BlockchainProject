import { getContract } from "./blockchain-integration-script.js";

let contract;
let metamaskAccount;

$(document).ready(function() 
{
    loadContractInfo();
});

async function loadContractInfo() {
    const info = await getContract();
    contract = info[0];
    metamaskAccount = info[1];

    loadCampaigns();
}

async function loadCampaigns()
{
  const campaigns = await contract.methods.getOwnedCampaigns(metamaskAccount).call();

  const campaignIds = campaigns.map(campaign => campaign.id);
  const response = await fetch('/get-campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaign_ids: campaignIds }),
  });

  if (response.ok) {
    const titlesDescriptions = await response.json();

    for (let i = 0; i < campaigns.length; i++) {
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

      createCampaign(title, description, start, end, limit, donated, id, status, revision);
    }
  } 
}

function createCampaign(title, description, start, end, limit, donated, id, status, revision) {
    let newCampaign;
    if(status == 'Pending'){
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
    
        if (startDate < sevenDaysLater) {
            newCampaign.find('.btn-approve').hide();
        }

        $('#pending-campaigns').append(newCampaign); 
    }
    else if(status == 'Revision'){
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
      
          if (revisionDate < sevenDaysLater) {
              newCampaign.find('.btn-approve').hide();
          }
  
          $('#pending-campaigns').append(newCampaign); 
      }
    else if(status == 'Active'){
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

        $('#active-campaigns').append(newCampaign); 
    }
    else if(status == 'Ended'){
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

        $('#ended-campaigns').append(newCampaign); 
    }
    else if(status == 'Disapproved' || status == 'Banned'){
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

        $('#ended-campaigns').append(newCampaign); 
    }
  
    newCampaign.find('#btn-finalize').on('click', async function() {
      const campaignId = $(this).data('id');
      try {
        await contract.methods.finalizeCampaign(campaignId).send({from: metamaskAccount});
      } catch (error) {
        displayError(error);
      }
    });
  
    newCampaign.find('#btn-end').on('click', async function() {
        const campaignId = $(this).data('id');
        try {
            await contract.methods.terminateCampaign(campaignId).send({from: metamaskAccount});
        } catch (error) {
            displayError(error);
        }
    });
  
    newCampaign.find('#btn-finalize-revision').on('click', async function() {
      const campaignId = $(this).data('id');
      try {
        await contract.methods.finalizeRevisionCampaign(campaignId).send({from: metamaskAccount});
      } catch (error) {
        displayError(error);
      }
    });
}

function convertUnixTimestamp(unixTimestamp) {
    // Create a new Date object with the provided Unix timestamp (in milliseconds)
    const date = new Date(unixTimestamp * 1000);
  
    // Extract the various components of the date
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Month is zero-based, so add 1
    const day = ('0' + date.getDate()).slice(-2);
  
    // Create a formatted date string
    const formattedDate = `${year}/${month}/${day}`;
  
    return formattedDate;
  }
  
  function getStatusString(status) {
    switch (status) {
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

// Function to display error messages using alert
function displayError(error) {
    let errorMessage;

    if (error.message.includes('revert')) {
        // Access the revert reason, which is the require error message
        errorMessage = error.message.split('Reason given: ')[1];
    } else {
        // Handle other types of errors
        errorMessage = error.message;
    }

    // Show the error message using alert
    alert('Error: ' + errorMessage);
}