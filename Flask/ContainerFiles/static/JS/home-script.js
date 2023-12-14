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
