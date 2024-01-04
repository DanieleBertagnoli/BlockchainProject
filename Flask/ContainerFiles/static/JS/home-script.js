import { getContract } from "./blockchain-integration-script.js";

let campaignWindow = 1;
let contract;
let metamaskAccount;

$(document).ready(function() 
{
  $(window).on("scroll", function() 
  {
    $(".animated").each(function() 
    {
      var divPosition = $(this).offset().top;
      var windowHeight = $(window).height();
      var scroll = $(window).scrollTop();

      if (scroll > divPosition - (windowHeight - windowHeight/3)) 
      {
       $(this).css(
        {
          opacity: 1,
          transform: "translateY(0)"
        });
      }
    });
  });

  loadContractInfo();
});

function loadMoreCampaigns() 
{
    for (let i = 0; i < 2; i++) 
    {
        const newCampaign = createCampaign("New Campaign Title", "Description for the new campaign.");
        $('#btns-more-less').before(newCampaign); // Insert the new campaign before the "Load More" button
    }
    updateShowLessButton();
}

function promptDonation(campaignId) {
  const donatedEth = prompt('Enter the number of donated ETH (step of 0.0005):');
  if (donatedEth !== null && donatedEth%0.0005 == 0) {
    donateCampaign(campaignId, donatedEth);
  }
  else {
    alert('You can donate only with steps of 25k wei');
  }
}

function createCampaign(title, description, start, end, limit, donated, id, status) {
  let newCampaign;
  if(status == 'Pending' || status == 'Revision'){
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
      '<button class="btn-custom btn-approve" data-id="' + id + '" data-status="' + status + '"><span>Approve</span><i class="bi bi-hand-thumbs-up-fill"></i></button>' +
      '</div>' +
      '<div class="btn-wrapper">' +
      '<button class="btn-custom btn-disapprove" data-id="' + id + '" data-status="' + status + '"><span>Disapprove</span><i class="bi bi-hand-thumbs-down-fill"></i></button>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
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
      '<h3>' + donated + ' / ' + limit + ' Wei</h3>' +
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
  }

  // Attach event listener for the "Donate" button
  newCampaign.find('.btn-donate').on('click', function() {
    const campaignId = $(this).data('id');
    promptDonation(campaignId);
  });

  // Attach event listener for the "Report" button
  newCampaign.find('.btn-report').on('click', function() {
    const campaignId = $(this).data('id');
    reportCampaign(campaignId);
  });

  // Attach event listener for the "Report" button
  newCampaign.find('.btn-approve').on('click', function() {
    const campaignId = $(this).data('id');
    const campaignStatus = $(this).data('status');
    voteForCampaign(campaignId, true, campaignStatus);
  });

  // Attach event listener for the "Report" button
  newCampaign.find('.btn-disapprove').on('click', function() {
    const campaignId = $(this).data('id');
    const campaignStatus = $(this).data('status');
    voteForCampaign(campaignId, false, campaignStatus);
  });

  $('#btn-more').before(newCampaign); // Insert the new campaign before the "Load More" button
}

async function voteForCampaign(campaignId, approval, campaignStatus) {

  if(campaignStatus == "Pending") {
    try {
      await contract.methods.voteForCampaign(campaignId, approval).send({from: metamaskAccount});
      alert('Vote sent!');
    } catch(e) {
      alert('You have already voted for this campaign');
    }
  }
  else if (campaignStatus == "Revision") {
    try {
      await contract.methods.revisionCampaign(campaignId, approval).send({from: metamaskAccount});
      alert('Vote sent!');
    } catch(e) {
      alert('You have already voted for this campaign');
    }
  }
}

async function loadContractInfo() {
  
  const info = await getContract();
  contract = info[0];
  metamaskAccount = info[1];

  // Call the contract method
  const dstBalance = await contract.methods.dstBalances(metamaskAccount).call();
  $('#dst-amount').text(dstBalance);

  if(dstBalance < 100){ 
    $('#become-ssj').hide(); 
    $('#exit-ssj').hide();
  }

  await loadCampaignWindow();

  const vault = await contract.methods.ssjVaults(metamaskAccount).call();

  if(vault > 0){ 
    $('#user-role').text('SSJ, Vault:' + web3.utils.fromWei(vault, 'ether') + ' ETH'); 
    $('#exit-ssj').show();
    $('#become-ssj').hide();
    $('.btn-approve').show();
    $('.btn-disapprove').show(); 
  }
  else{ 
    $('#user-role').text('NormalUser'); 
    $('.btn-approve').hide();
    $('.btn-disapprove').hide(); 
    $('#become-ssj').show();
    $('#exit-ssj').hide();
  }
}

window.loadCampaignWindow = function () { loadCampaignWindow(); }

async function loadCampaignWindow()
{
  const campaigns = await contract.methods.getCampaigns(campaignWindow).call();
  campaignWindow++;

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

      createCampaign(title, description, start, end, limit, donated, id, status);
    }
  } 
}

window.exitSSJ = function() { exitSSJ(); };

async function exitSSJ()
{
  await contract.methods.becomeNormalUser().send({from: metamaskAccount});
  
  $('#user-role').text('NormalUser'); 
  $('.btn-approve').hide();
  $('.btn-disapprove').hide(); 
  $('#become-ssj').show();
  $('#exit-ssj').hide();
}

window.becomeSSJ = function() { becomeSSJ(); };

async function becomeSSJ()
{
  await contract.methods.becomeSSJ().send({from: metamaskAccount, value: web3.utils.toWei('0.5', 'ether')});
  const vault = await contract.methods.ssjVaults(metamaskAccount).call();

  if(vault > 0){ 
    $('#user-role').text('SSJ, Vault:' + web3.utils.fromWei(vault, 'ether') + ' ETH'); 
    $('#exit-ssj').show();
    $('#become-ssj').hide();
    $('.btn-approve').show();
    $('.btn-disapprove').show(); 
  }
  else{ 
    $('#user-role').text('NormalUser'); 
    $('.btn-approve').hide();
    $('.btn-disapprove').hide(); 
    $('#become-ssj').show();
    $('#exit-ssj').hide();
  }
}

async function reportCampaign(id) {
  
  if($('#dst-amount').text() == 0) {
    alert('You don\'t have enough DST!');
  }
  else {
    await contract.methods.reportCampaign(id).send({from:metamaskAccount});
    const dstBalance = await contract.methods.dstBalances(metamaskAccount).call();
    $('#dst-amount').text(dstBalance); 
    alert('Campaign reported! 1 DST removed');
  }
}

async function donateCampaign(id, donatedEth) {
  await contract.methods.donateCampaign(id).send({from: metamaskAccount, value: web3.utils.toWei(donatedEth, 'ether')});
  const dstBalance = await contract.methods.dstBalances(metamaskAccount).call();
  $('#dst-amount').text(dstBalance); 
  alert('Donation completed!');
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