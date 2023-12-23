const web3 = new Web3(Web3.givenProvider || "ws://172.17.0.1:7545");

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

  callContract();
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

function createCampaign(title, description) 
{
    const newCampaign = $('<div class="single-campaign">' +
        '<h2 class="campaign-title">' + title + '</h2>' +
        '<div class="campaign-description">' +
        '<p>' + description + '</p>' +
        '</div>' +
        '<div class="buttons buttons-campaigns">' +
        '<div class="btn-wrapper">' +
        '<button class="btn-custom"><span>Donate</span><i class="bi bi-piggy-bank-fill"></i></button>' +
        '</div>' +
        '<div class="btn-wrapper">' +
        '<button class="btn-custom btn-report"><span>Report</span><i class="bi bi-flag-fill"></i></button>' +
        '</div>' +
        '</div>' +
        '</div>');

    return newCampaign;
}

function loadLessCampaigns() 
{
    // Remove the last 2 campaigns
    $('.campaigns .single-campaign:gt(-3)').remove();
    updateShowLessButton();
}

function updateShowLessButton() 
{
    // Check if the number of loaded campaigns is less than 2
    const numLoadedCampaigns = $('.campaigns .single-campaign').length;

    if (numLoadedCampaigns <= 2) // Hide the "Show Less" button
    { $('#btn-less').attr('hidden', true); } 
    else // Show the "Show Less" button
    { $('#btn-less').removeAttr('hidden'); }
}



// Specify the address of your deployed smart contract
const contractAddress = '0xc954D8E16E25d2FBc183E8eD1c3D0A5E0D1dA30D'; // Replace with the actual address
// Specify the ABI (Application Binary Interface) of your smart contract
const contractABI = [
  {
    "inputs": [],
    "name": "greet",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
];

// Create a contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

function callContract() {
  // Check if MetaMask is installed
  if (window.ethereum) {
    // Use MetaMask provider
    window.web3 = new Web3(window.ethereum);

    // Check if the user has granted account access
    window.ethereum.enable()
      .then(() => {
        console.log('Connected to MetaMask');

        // Call the greet function
        contract.methods.greet().call()
          .then(result => {
            console.log('Greeting:', result);
          })
          .catch(error => {
            console.error('Error calling greet function:', error);
          });
      })
      .catch(error => {
        console.error('User denied account access or there was an error:', error);
      });
  } else {
    console.error('MetaMask is not installed. Please install MetaMask to use this DApp.');
  }
}
