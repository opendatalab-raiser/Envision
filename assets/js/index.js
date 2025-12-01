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
			autoplay: false, // Disable autoplay to let user control manually
			autoplaySpeed: 5000, 
			pauseOnHover: true,
    }

    // Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
    window.carousels = carousels; // Export to window for debugging/access

    // Force autoplay start for all carousels to ensure it works
    if (carousels && carousels.length > 0) {
        carousels.forEach(function(carousel) {
            if (carousel.options.autoplay && carousel._autoplay) {
                console.log('Forcing autoplay start for carousel:', carousel.element.id);
                carousel._autoplay.start();
            }
        });
    }


    // Expose moveCarousel globally
    window.moveCarousel = function(carouselId, direction) {
        console.log('moveCarousel called:', carouselId, direction);
        var element = document.getElementById(carouselId);
        
        // Attempt 1: Check for direct property on DOM element
        if (element && element.bulmaCarousel) {
            console.log('Using element.bulmaCarousel');
            if (direction === 'next') element.bulmaCarousel.next();
            else element.bulmaCarousel.previous();
            return;
        }

        // Attempt 2: Check global instances array
        if (window.carousels) {
            for(var i=0; i<window.carousels.length; i++) {
                // Check if the instance's element matches our ID
                if (window.carousels[i].element && window.carousels[i].element.id === carouselId) {
                    console.log('Found instance in window.carousels');
                    if (direction === 'next') window.carousels[i].next();
                    else window.carousels[i].previous();
                    return;
                }
            }
        }

        // Attempt 3: Find and click the internal navigation buttons
        // These are usually created by bulma-carousel inside the wrapper
        if (element) {
            console.log('Searching for internal buttons');
            
            // bulma-carousel usually wraps the original element in a .carousel or .slider wrapper
            var wrapper = element.closest('.carousel') || element.closest('.slider');
            if (!wrapper) wrapper = element; // Fallback to checking element itself if wrapper not found

            // Look for the slider-navigation buttons
            var navBtn = wrapper.querySelector('.slider-navigation-' + direction);
            if (navBtn) {
                console.log('Found internal button in wrapper, simulating click');
                navBtn.click();
                return;
            }
            
            // Broader search if the structure is unexpected
            var navBtns = wrapper.querySelectorAll('.slider-navigation-' + direction);
            if (navBtns.length > 0) {
                console.log('Found internal button in wrapper (fallback), simulating click');
                navBtns[0].click();
                return;
            }
        }
        
        console.error('moveCarousel: Could not find carousel instance or buttons for', carouselId);
    }

    // Custom Carousel Logic for Key Figures
    var currentFigureIndex = 0;
    window.switchFigure = function(direction) {
        var items = document.querySelectorAll('#key-figures-carousel .figure-item');
        if (items.length === 0) return;

        // Hide current
        items[currentFigureIndex].style.display = 'none';
        items[currentFigureIndex].classList.remove('active');

        // Calculate next
        currentFigureIndex += direction;
        if (currentFigureIndex >= items.length) {
            currentFigureIndex = 0;
        } else if (currentFigureIndex < 0) {
            currentFigureIndex = items.length - 1;
        }

        // Show next
        items[currentFigureIndex].style.display = 'block';
        items[currentFigureIndex].classList.add('active');
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

    /*
    $('#interpolation-slider').on('input', function(event) {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();
    */

})
