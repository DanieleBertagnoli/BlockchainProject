/**
	* jQuery document-ready function that initializes scroll-based animations.
	* - Attaches a scroll event handler to the window to trigger animations for elements with the "animated" class.
	*   Animations occur when the element is within one-third of the window's height.
*/
$(document).ready(function() 
{
	$(window).on("scroll", function() 
  	{
    	$(".animated").each(function() 
    	{
      		var divPosition = $(this).offset().top;
      		var windowHeight = $(window).height();
      		var scroll = $(window).scrollTop();

      		if(scroll > divPosition - (windowHeight - windowHeight / 3)) 
     		{
        		$(this).css({
          			opacity: 1,
          			transform: "translateY(0)"
        		});
      		}
    	});
  	});
});
