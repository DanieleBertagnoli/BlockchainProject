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

    var ethLimit = $('#eth-limit').val();
    if (ethLimit < 0.05) 
    {
        createErrorMsg('The wei limit must be greater than 0.05 ETH.');
        return false; // Prevent the form submission
    }

    const combactLvl = await contract.methods.getUserCombactLvl(metamaskAccount).call();
    if(ethLimit > combactLvl / 10) {
      createErrorMsg("Your combact level is too low for the requested ETH!");
      return false; // Prevent the form submission
    }
    
    var weekDuration = $('#week-duration').val();
    if (weekDuration < 8) 
    {
        createErrorMsg('The campaign duration must be at least 8 week.');
        return false; // Prevent the form submission
    }

    const deposit =  ethLimit*0.05;

    const result = await contract.methods.createCampaign(web3.utils.toWei(ethLimit, 'ether'), weekDuration).send({
      from: metamaskAccount, 
      value: web3.utils.toWei(deposit+'', 'ether')
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
          createSuccessMsg();
          $('#form')[0].reset();
      },
      error: function(error) {
          createErrorMsg(error);
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

function createSuccessMsg() {
  
  // Check if the error message element already exists
  var successAlert = $('#success-alert');

  // If it doesn't exist, create it
  if (!successAlert.length) 
  {
      var alertHtml = `
      <div class="alert alert-success alert-dismissible fade show" role="alert">
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:"><use xlink:href="#check-circle-fill"/></svg>
        Campaign created successfully!
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
      `;

      // Insert the error message element before the form
      $('.form').before(alertHtml);
  }
}