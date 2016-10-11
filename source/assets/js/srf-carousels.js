var $carousels = [];
var loadedCarousels = {};
var css = {
    'containers': '.carousel__js'
};

export function init() {
    $carousels = $(css.containers);
    $.each($carousels, function (i, carousel) {
        var $carousel = $(carousel);
        loadedCarousels[$carousel.attr("id")] = false;
        $carousel.slick({
            speed: 300,
            slidesToShow: 1,
            infinite: false,
            prevArrow: '<a href="#" class="carousel__link--prev" />', // slick does this the wrong way around!
            nextArrow: '<a href="#" class="carousel__link--next" />',
            slide: ".carousel__item",

        });
        registerListener($carousel);

        //prevent flicker effect on page load
        $(css.containers).on('init', function () {
            $(css.containers).css("visibility", "visible");
        });
    });

    $('.video_carousel__js').slick({
        speed: 300,
        infinite: false,
        slide: ".carousel__item",
        lazyLoad: "ondemand",
        slidesToShow: 1,
        slidesToScroll: 1,
        initialSlide: 0,
        dots: false,
        arrows: false,
        mobileFirst: true,
        centerMode: true,
        responsive: [
            {
                breakpoint: 1024, // desktop
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    dots: true,
                    arrows: true,
                    prevArrow: '<a href="#" class="carousel__link--prev" />',
                    nextArrow: '<a href="#" class="carousel__link--next" />',
                    centerMode: false
                }
            }, {
                breakpoint: 720, // tablet
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    dots: true,
                    arrows: true,
                    prevArrow: '<a href="#" class="carousel__link--prev" />',
                    nextArrow: '<a href="#" class="carousel__link--next" />',
                    centerMode: false
                }
            }
        ]
    });
}

function registerListener($carousel) {
    // load all images after user starts interacting with carousel
    $carousel.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
        if (loadedCarousels[$carousel.attr("id")] === false) {
            loadedCarousels[$carousel.attr("id")] = true;
            loadLazyImages(slick.$slides.find(".image-figure__js"));
        }
    });
}

function loadLazyImages(images) {
    images.each(function (i, image) {
        var $image = $(image);
        if ($image.data("src")) {
            $image.attr("srcset", $image.data("srcset"));
            $image.attr("src", $image.data("src"));

        }
    });
}

