import { getContract } from "./blockchain-integration-script.js";

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

  $("form").submit(function(e)
  { 
    e.preventDefault(); 
    checkForm();
  });

  loadContractInfo();
});

async function loadContractInfo() {
  const info = await getContract();
  contract = info[0];
  metamaskAccount = info[1];
}

async function checkForm()
{
    var title = $('#title').val();
    if (!title) 
    {
        createErrorMsg('Please enter the campaign title.');
        return false; // Prevent the form submission
    }

    var description = $('#description').val();
    if (!description) 
    {
        createErrorMsg('Please enter the campaign description.');
        return false; // Prevent the form submission
    }

    var weiLimit = $('#wei-limit').val();
    if (weiLimit < 250000) 
    {
        createErrorMsg('The wei limit must be greater than 250k.');
        return false; // Prevent the form submission
    }

    var weekDuration = $('#week-duration').val();
    if (weekDuration < 1) 
    {
        createErrorMsg('The campaign duration must be at least 1 week.');
        return false; // Prevent the form submission
    }

    const result = await contract.methods.createCampaign(weiLimit, weekDuration).send({
      from: metamaskAccount, 
      value: weiLimit*5/100
    }); 

    const event = result.events.CampaignCreation;
    const campaignId = event.returnValues.campaignId;

    // AJAX request to send campaign details to the server
    $.ajax({
      url: '/save-campaign',
      method: 'POST',
      data: {
          title: title,
          description: description,
          id: campaignId
      },
      success: function(response) {
          console.log('Campaign details saved on the server:', response);
      },
      error: function(error) {
          console.error('Error saving campaign details on the server:', error);
      }
    });

    return false;
}

function createErrorMsg(errorMsg) 
{
    // Check if the error message element already exists
    var errorAlert = $('#error-alert');

    // If it doesn't exist, create it
    if (!errorAlert.length) 
    {
        var alertHtml = `
            <div id="error-alert" class="alert alert-danger alert-dismissible fade show" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                <span>${errorMsg}</span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Insert the error message element before the form
        $('.form').before(alertHtml);
    }  
    else // If it already exists, update the content
    { errorAlert.find('span').text(errorMsg); }
}