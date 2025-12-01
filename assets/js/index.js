window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "https://homes.cs.washington.edu/~kpar/nerfies/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 1,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
    window.carousels = carousels; // Export to window for debugging/access

    // Expose moveCarousel globally
    window.moveCarousel = function(carouselId, direction) {
        // Attempt 1: Use the instance directly if available in the global array
        if (window.carousels) {
            for(var i=0; i<window.carousels.length; i++) {
                if (window.carousels[i].element.id === carouselId) {
                    if (direction === 'next') window.carousels[i].next();
                    else window.carousels[i].previous();
                    return;
                }
            }
        }

        // Attempt 2: Find internal buttons via DOM traversal
        // The bulma-carousel often wraps the target element or modifies structure.
        // Usually structure: .slider > .slider-container > #carouselId
        // Buttons are siblings of .slider-container
        
        var element = document.getElementById(carouselId);
        if (element) {
            // Look for the closest '.slider' or '.carousel' wrapper
            // bulma-carousel adds 'slider' class to wrapper
            var wrapper = element.closest('.slider'); 
            if (!wrapper) wrapper = element.closest('.carousel');
            
            if (wrapper) {
                var btn = wrapper.querySelector('.slider-navigation-' + direction);
                if (btn) {
                    btn.click();
                    return;
                }
            }
        }
        
        console.error('moveCarousel: Could not find carousel instance or buttons for', carouselId);
    }

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function(event) {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

})
