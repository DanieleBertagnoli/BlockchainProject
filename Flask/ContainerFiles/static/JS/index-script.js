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