/*
Author : EGrappler.com

URL    : http://www.egrappler.com

License: This software is free for personal and commercial use. 
         However, you can not resale it, re-distribute it as it is.
         Neither you can upload it to your own server for download.
         If you want to spread the word, please link back to the original post.
*/
(function ($) {
    $.fn.extend({
        quake: function (options) {
            var settings = $.extend({
                frameWidth: 990,
                frameHeight: 306,
                animationSpeed: 500,
                pauseTime: 4000,
                rows: 4,
                cols: 12,
                thumbnails: true,
                effects: ['randomFade', 'linearPeal', 'linearPealReverse', 'swirlFadeIn', 'swirlFadeOut',
                 'diagonalFade', 'blind', 'barsUp', 'barsDown', 'blindFade', 'explode', 'explodeFancy', 'mixBars',
                 'mixBarsFancy', 'fade', 'blindFadeReverse', 'slideIn', 'slideInFancy', 'slideLeft', 'slideRight',
                 'slideUp', 'slideDown', 'fallingBlindFade', 'raisingBlindFade'],
                nextText: 'Next',
                prevText: 'Prev',
                hasNextPrev: true,
                captionOpacity: 0.5,
                captionOrientations: ['right'],
                captionAnimationSpeed: 1000,
                thumbnailsPath: 'images/thumbs',
                captionsSetup: null
            }, options);

            return this.each(function () {
                //local variables
                var frameWidth = settings.frameWidth;
                var frameHeight = settings.frameHeight;
                var cols = settings.cols;
                var rows = settings.rows;
                var smallThumbHeight = 10;
                var animationSpeed = settings.animationSpeed;
                var pauseTime = settings.pauseTime + animationSpeed;
                var effects = settings.effects;
                var sliderContainer = $(this);
                var showThumbnails = settings.thumbnails;
                var images = new Array();
                var currentImage = null;
                var previousImage = null;
                var currentImageIndex = 0;
                var previousImageIndex = 0;
                var coordinates = new Array();
                var timeFactor = 0;
                var animationInterval;
                var centerLeft = 0;
                var centerTop = 0;
                var zindex = 100;
                var circles = 10;
                var direction = 'backward'; //for reverse peal animation
                var isForward = true; //for next, prev directions
                var minCircumeference;
                var currentRow = 0;
                var isAnimating = false;
                var captionContainer;
                var navContainer;
                var totalImages;
                var captions;
                var visibleTumbnails = 0;

                var sliderWrapper = $('<div/>').addClass('quake-slider-wrapper');
                sliderWrapper.css({ 'width': frameWidth, 'height': frameHeight });
                if (!sliderContainer.hasClass('quake-slider'))
                    sliderContainer.addClass('quake-slider');
                sliderContainer.before(sliderWrapper);

                sliderWrapper.append(sliderContainer);

                sliderContainer.find('.quake-slider-images').css('display', 'none');
                sliderContainer.find('.quake-slider-captions').css('display', 'none').addClass('quake-slider-caption-container');

                if (frameWidth % 2 != 0) circles--;

                centerLeft = frameWidth / 2;
                centerTop = frameHeight / 2;

                $(window).load(function () {
                    //once page is fully loaded, go ahead with slider                    
                    navContainer = $('<div/>').addClass('quake-nav');
                    navContainer.append($('<a/>').addClass('quake-prev').html(settings.prevText)).append($('<a/>').addClass('quake-next').html(settings.nextText));
                    totalImages = sliderContainer.find('.quake-slider-images img').length;
                    captions = sliderContainer.find('.quake-slider-caption').clone(true).css({ opacity: 1 });
                    $('.quake-slider-images img', sliderContainer).each(function () {
                        //check for anchors
                        if ($(this).parent().is('a')) {
                            var el = $(this).parent().clone();
                            images.push(el);
                        }
                        else
                            images.push($(this).clone());
                    });

                    setup();
                    addNavigationControls();
                    runAnimation();
                    start();
                });
                function setup() {
                    captionContainer = $('.quake-slider-caption-container').css('opacity', settings.captionOpacity).html('');
                    sliderContainer.html('');
                    var link = $('<a/>').addClass('quake-link');
                    link.css('display', 'none');
                    link.css('width', frameWidth);
                    link.css('height', frameHeight);
                    sliderContainer.prepend(link);

                    if (settings.hasNextPrev) {
                        sliderContainer.append(navContainer);
                        navContainer.hide();
                        sliderContainer.mouseenter(function () { stop(); navContainer.show(); }).mouseleave(function () { navContainer.hide(); start(); });
                        navContainer.find('.quake-prev').click(function () {
                            if (!isAnimating) {
                                stop();
                                currentImageIndex = previousImageIndex;
                                currentImageIndex -= 1;
                                if (currentImageIndex < 0)
                                    currentImageIndex = images.length - 1;
                                runAnimation();
                            }
                        });

                        navContainer.find('.quake-next').click(function () {
                            if (!isAnimating) {
                                stop();
                                runAnimation();
                            }
                        });
                    }
                    sliderContainer.append(captionContainer);
                }
                function start() {
                    animationInterval = setInterval(runAnimation, pauseTime);
                }
                function stop() {
                    isAnimating = false;
                    clearInterval(animationInterval);
                    animationInterval = null;
                }
                function addNavigationControls() {
                    var navWrapper = $('<div/>').addClass('quake-nav-wrapper');
                    var nav = $('<div/>').addClass('quake-nav-container');
                    navWrapper.append(nav);
                    $(images).each(function (index, image) {
                        nav.append($('<a/>').attr('href', '#').attr('rel', index).addClass('quake-nav-control').html(index));
                    });
                    $('.quake-nav-container a').live('click', onNavClick);
                    sliderContainer.after(navWrapper);
                    var w = totalImages * parseFloat(nav.find('a').outerWidth());
                    nav.css('width', w);

                    if (settings.thumbnails) {
                        var thumbnail = $('<div/>').css({ display: 'none', opacity: '0' });
                        thumbnail.addClass('quake-thumbnail').append($('<div/>').addClass('quake-thumbnail-preview').append($('<img/>')));
                        navWrapper.append(thumbnail);
                        $('.quake-nav-container a').live('mouseenter', function () {
                            var center = $(this).position().left + $(this).outerWidth() / 2;
                            var left = center - thumbnail.outerWidth() / 2;
                            var top = $(this).position().top - thumbnail.outerHeight();
                            //set img source, take it from thumbnails directory
                            var img = images[parseInt($(this).html())];

                            if (img != null) {
                                var parts = getImageSrc(img).split('/');
                                var imgPath = settings.thumbnailsPath + '/' + parts[parts.length - 1];
                                thumbnail.find('img').attr('src', imgPath);
                                thumbnail.css({ left: left, top: top, display: 'block' }).stop(true, true).animate({ opacity: 1 }, 500);
                            }
                        });

                        $('.quake-nav-container a').live('mouseleave', function () {
                            thumbnail.css({ display: 'none', opacity: 0 });

                        });
                    }

                }
                function onNavClick() {
                    if (!isAnimating && !$(this).hasClass('active')) {
                        isAnimating = false;
                        currentImageIndex = parseInt($(this).attr('rel'));
                        stop();
                        runAnimation();
                        start();
                    }
                    return false;
                }

                //Animations 
                function animateRandomFade() {
                    createBoxes();
                    var factor = 0;
                    var complete = 0;
                    var randomElements = $(".quake-el").get().sort(function () {
                        return Math.round(Math.random()) - 0.5
                    });

                    $(randomElements).each(function (index) {
                        var pos = coordinates[index];
                        var strPost = 'left:' + pos.left + '; top:' + pos.top + '';
                        $(this).css('background-position', strPost);

                    });
                    $(randomElements).each(function (index) {
                        if (complete < randomElements.length) {
                            var el = $(this);
                            setTimeout(function () {
                                try {
                                    el.fadeIn(animationSpeed, function () {
                                        complete++;
                                        if (complete == randomElements.length) {
                                            animationComplete();
                                        }
                                    });
                                }
                                catch (ex) { }
                            }, factor);
                            factor += timeFactor * 2;
                        }

                    });
                }


                function animateLinearPeal() {
                    createBoxes();
                    var factor = 0;
                    var complete = 0;
                    var total = $('.quake-el').length;
                    $('.quake-el', sliderContainer).each(function () {
                        var el = $(this);
                        setTimeout(function () {
                            el.fadeIn(animationSpeed, function () {
                                complete++;
                                if (complete == total) {
                                    animationComplete();
                                }
                            });
                        }, factor * 3);
                        factor += timeFactor;
                    });
                }
                function animateReversePeal() {
                    createBoxes();
                    var factor = 0;
                    var complete = 0;
                    var indeces = new Array();

                    $('.quake-el').each(function (index) {
                        swapDirection(index);
                        if (direction == 'forward') {
                            indeces.push(index);
                        }
                        else {
                            var en = (currentRow * cols - 1) + (((currentRow - 1) * cols) - index);
                            indeces.push(en);
                        }
                    });

                    $('.quake-el').each(function (index) {
                        setTimeout(function () {
                            $('.quake-el:eq(' + indeces[index] + ')', sliderContainer).fadeIn(animationSpeed / 2, function () {
                                complete++;
                                if (complete == indeces.length) {
                                    animationComplete();
                                }
                            });

                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }


                function animateSwirlFadeIn() {
                    createCircles(currentImageIndex);
                    var factor = 0;
                    var complete = 0;
                    var radea = new Array();
                    $('.quake-el', sliderContainer).each(function (index) {
                        radea.push(minCircumeference * (index + 1));
                    });
                    radea[radea.length - 1] = 0;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.css({ borderRadius: radea[index] }).animate({ opacity: 1, zIndex: 0 }, animationSpeed, function () {
                                complete++;
                                if (complete == radea.length) {
                                    animationComplete();
                                }
                            });
                        }, factor);
                        factor += timeFactor;
                    });
                }

                function animateSwirlFadeOut() {
                    var divImage = $('<div/>').css({
                        zIndex: 1,
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        width: '100%',
                        height: '100%'

                    }).addClass('quake-fi'); //quake-fi = quake-fullimage

                    createCircles(previousImageIndex);
                    $('.quake-el', sliderContainer).css('opacity', '1', zindex, 2);

                    var radea = new Array();
                    $('.quake-el', sliderContainer).each(function (index) {
                        $(this).css({ borderRadius: minCircumeference * (index + 1) });
                    });
                    $('.quake-el:last').css({ borderRadius: 0 });

                    sliderContainer.append(divImage);
                    setTimeout(function () {

                        hideIt(1);
                    }, 0);
                }
                function hideIt(i) {
                    var factor = 0;
                    var complete = 0;
                    var index = circles - i;
                    var op = index + 1;
                    op /= 10;
                    op = 1 - op;
                    $('.quake-el:eq(' + index + ')', sliderContainer).animate({ opacity: op }, timeFactor, function () {
                        if (i < $('.quake-el', sliderContainer).length - 1) {
                            i++;
                            hideIt(i);
                        }
                        else {
                            $('.quake-el', sliderContainer).animate({ opacity: 0 }, 500);
                            setTimeout(animationComplete, 501);
                        }
                    });
                }
                function animateDiagonally() {
                    var factor = 0;
                    var complete = 0;
                    var w = Math.ceil(frameWidth / cols);
                    var h = Math.ceil(frameHeight / rows);

                    for (var row = 0; row < rows; row++) {
                        for (var col = 0; col < cols; col++) {
                            $('<div/>').addClass('quake-el').css({
                                width: w,
                                height: h,
                                left: Math.ceil(col * w),
                                top: Math.ceil(row * h),
                                position: 'absolute',
                                opacity: 0,
                                backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                                backgroundPosition: '' + (-(col * w)) + 'px ' + (-(row * h)) + 'px'
                            }).appendTo(sliderContainer);
                        }
                    }
                    var total = rows * cols;
                    timeFactor = animationSpeed / total;
                    var diagonal = new Array();
                    for (var i = 0; i < rows + cols - 1; i++) {
                        diagonal.push(i);
                        diagonal[i] = new Array();
                        for (var j = Math.min(rows, i + 1) - 1; j >= Math.max(0, i - cols + 1); j--) {
                            diagonal[i].push((j * cols) + i - j);
                        }
                    }

                    $(diagonal).each(function (index, elements) {
                        setTimeout(function () {
                            $(elements).each(function (i, val) {
                                $('.quake-el:eq(' + val + ')').animate({ opacity: 1 }, animationSpeed, function () {
                                    complete++;
                                    if (complete == total) {
                                        animationComplete();
                                    }
                                });
                            });

                        }, factor * 6);
                        factor += timeFactor;

                    });

                }

                function animateBlind() {
                    var bars = cols * 2;
                    var factor = 0;
                    var complete = 0;
                    var w = frameWidth / bars;
                    if (w % 10 != 0) w++;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: 0,
                            height: frameHeight,
                            left: Math.ceil((i * frameWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * frameWidth / bars)) + 'px 0px'
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ width: w }, animationSpeed, function () {
                                complete++;
                                if (complete == bars) {
                                    animationComplete();
                                }
                            });

                        }, factor);
                        factor += timeFactor;
                    });
                }

                function animateBlindFade() {
                    var bars = cols * 2;
                    var factor = 0;
                    var complete = 0;
                    var w = frameWidth / bars;
                    if (w % 10 != 0) w += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: w,
                            height: frameHeight,
                            left: Math.ceil((i * frameWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * frameWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1) {
                                    animationComplete();
                                }
                            });

                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateBlindFadeReverse() {
                    var bars = cols * 2;
                    var factor = 0;
                    var complete = 0;
                    var w = frameWidth / bars;
                    if (w % 10 != 0) w += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: w,
                            height: frameHeight,
                            left: Math.ceil((i * frameWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * frameWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $('.quake-el', sliderContainer).eq((bars - (index + 1))); // $(this);
                        setTimeout(function () {
                            el.animate({ opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1) {
                                    animationComplete();
                                }
                            });

                        }, factor * 2);
                        factor += timeFactor;
                    });
                }

                function animateFallingBlindFade() {
                    var bars = rows * 2;
                    var factor = 0;
                    var complete = 0;
                    var h = frameHeight / bars;
                    if (h % 10 != 0) h += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: frameWidth,
                            height: h,
                            left: 0,
                            top: Math.ceil((i * frameHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-(i * frameHeight / bars)) + 'px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1) {
                                    animationComplete();
                                }
                            });

                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateRaisingBlindFade() {
                    var bars = rows * 2;
                    var factor = 0;
                    var complete = 0;
                    var h = frameHeight / bars;
                    if (h % 10 != 0) h += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: frameWidth,
                            height: h,
                            left: 0,
                            top: Math.ceil((i * frameHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-(i * frameHeight / bars)) + 'px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $('.quake-el', sliderContainer).eq((bars - (index + 1))); //$(this);
                        setTimeout(function () {
                            el.animate({ opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1) {
                                    animationComplete();
                                }
                            });

                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateMixBars() {

                    var factor = 0;
                    var complete = 0;
                    var bars = (cols * rows) / 2;
                    timeFactor = animationSpeed / bars;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(frameWidth / bars),
                            height: frameHeight,
                            marginTop: (i % 2 == 0) ? -(frameHeight) : frameHeight,
                            left: Math.ceil((i * frameWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * frameWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }

                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ marginTop: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1)
                                    animationComplete();
                            });
                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function animateMixBarsFancy() {
                    var factor = 0;
                    var complete = 0;
                    var bars = (cols * rows) / 2;
                    timeFactor = animationSpeed / bars;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(frameWidth / bars),
                            height: frameHeight,
                            marginTop: (i % 2 == 0) ? -(frameHeight) : frameHeight,
                            left: Math.ceil((i * frameWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * frameWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }

                    $('.quake-el:odd', sliderContainer).each(function (index) {
                        var el = $('.quake-el', sliderContainer).eq(index);
                        var el1 = $('.quake-el', sliderContainer).eq(bars - (index + 1));
                        setTimeout(function () {
                            el.animate({ marginTop: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1)
                                    animationComplete();
                            });
                            el1.animate({ marginTop: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1)
                                    animationComplete();
                            });

                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function showBars(bars) {
                    bars.each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ marginTop: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1)
                                    animationComplete();
                            });
                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function animateBarDown() {
                    var factor = 0;
                    var complete = 0;
                    var bars = (cols * rows) / 2;
                    timeFactor = animationSpeed / bars;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(frameWidth / bars),
                            height: frameHeight,
                            marginTop: -(frameHeight),
                            left: Math.ceil((i * frameWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * frameWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }

                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ marginTop: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1)
                                    animationComplete();
                            });
                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function animateBarUp() {
                    var factor = 0;
                    var complete = 0;
                    var bars = (cols * rows) / 2;
                    timeFactor = animationSpeed / bars;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(frameWidth / bars),
                            height: frameHeight,
                            marginTop: frameHeight,
                            left: Math.ceil((i * frameWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * frameWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }

                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ marginTop: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1)
                                    animationComplete();
                            });
                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function animateExplode() {
                    var factor = 0;
                    var complete = 0;
                    var total = rows * cols;
                    timeFactor = animationSpeed / total;
                    var w = Math.ceil(frameWidth / cols);
                    var h = Math.ceil(frameHeight / rows);
                    var coordinates = new Array();
                    for (var row = 0; row < rows; row++) {
                        for (var col = 0; col < cols; col++) {
                            $('<div/>').css({
                                width: w, height: h,
                                left: Math.ceil((frameWidth / 2 - w / 2)),
                                top: Math.ceil((frameHeight / 2 - h / 2)),
                                opacity: 0,
                                position: 'absolute',
                                backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                                backgroundPosition: '' + (-(col * w)) + 'px ' + (-(row * h)) + 'px'
                            }).addClass('quake-el').appendTo(sliderContainer);
                            var position = [{ left: (col * w), top: (row * h)}];
                            coordinates.push(position);
                        }
                    }

                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        var p = coordinates[index][0];
                        el.animate({ left: p.left, top: p.top, opacity: 1 }, animationSpeed * 2, function () {
                            complete++;
                            if (complete == total - 1)
                                animationComplete();
                        });
                        factor += timeFactor;
                    });
                }
                function animateExplodeFancy() {
                    var factor = 0;
                    var complete = 0;
                    var total = rows * cols;
                    timeFactor = animationSpeed / total;
                    var w = Math.ceil(frameWidth / cols);
                    var h = Math.ceil(frameHeight / rows);
                    var coordinates = new Array();
                    for (var row = 0; row < rows; row++) {
                        for (var col = 0; col < cols; col++) {
                            $('<div/>').css({
                                width: 0, height: 0,
                                left: Math.ceil((frameWidth / 2 - w / 2)),
                                top: Math.ceil((frameHeight / 2 - h / 2)),
                                opacity: 0,
                                position: 'absolute',
                                backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                                backgroundPosition: '' + (-(col * w)) + 'px ' + (-(row * h)) + 'px'
                            }).addClass('quake-el').appendTo(sliderContainer);
                            var position = [{ left: (col * w), top: (row * h)}];
                            coordinates.push(position);
                        }
                    }

                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            var p = coordinates[index][0];
                            el.animate({ left: p.left, top: p.top, opacity: 1, width: w, height: h }, animationSpeed, function () {
                                complete++;
                                if (complete == total - 1) {
                                    animationComplete();
                                }
                            });
                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateFade() {
                    $('<div/>').css({
                        width: frameWidth,
                        height: frameHeight,
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 100,
                        opacity: 0
                    }).addClass('quake-el').appendTo(sliderContainer);

                    // setTimeout(function () {
                    $('.quake-el', sliderContainer).animate({ opacity: 1 }, animationSpeed * 2, function () {
                        animationComplete();
                    });
                    // }, 100);
                }

                function animateSlideIn() {
                    var factor = 0;
                    var complete = 0;
                    var bars = cols;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: frameWidth,
                            height: Math.ceil(frameHeight / bars),
                            marginLeft: -frameWidth,
                            top: Math.ceil((i * frameHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-Math.ceil((i * frameHeight / bars))) + 'px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;

                    $('.quake-el', sliderContainer).each(function () {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ marginLeft: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars)
                                    animationComplete();
                            });
                        }, factor * 2);
                        factor += timeFactor;
                    });
                }

                function animateSlideInFancy() {
                    var factor = 0;
                    var complete = 0;
                    var bars = cols;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: frameWidth,
                            height: Math.ceil(frameHeight / bars),
                            marginLeft: (i % 2 == 0) ? -frameWidth : frameWidth,
                            top: Math.ceil((i * frameHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-Math.ceil((i * frameHeight / bars))) + 'px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;

                    $('.quake-el', sliderContainer).each(function () {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ marginLeft: 0, opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars)
                                    animationComplete();
                            });
                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateSlideLeft() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: frameWidth,
                        height: frameHeight,
                        left: frameWidth,
                        top: 0,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 0
                    });
                    sliderContainer.append(cImage)
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: frameWidth,
                            height: frameHeight,
                            left: 0,
                            top: 0,
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(previousImage) + ')',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            zIndex: 100
                        });
                        sliderContainer.append(pImage);
                    }

                    var complete = 0;

                    $('.quake-el', sliderContainer).animate({ left: '-=' + frameWidth, opacity: 1 }, animationSpeed, function () {

                        complete++;
                        if (complete == 1)
                            animationComplete();

                    })

                }

                function animateSlideRight() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: frameWidth,
                        height: frameHeight,
                        left: -frameWidth,
                        top: 0,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 0
                    });
                    sliderContainer.append(cImage);
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: frameWidth,
                            height: frameHeight,
                            left: 0,
                            top: 0,
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(previousImage) + ')',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            zIndex: 100
                        });
                        sliderContainer.append(pImage);
                    }

                    var complete = 0;
                    $('.quake-el', sliderContainer).animate({ left: '+=' + frameWidth, opacity: 1 }, animationSpeed, function () {

                        complete++;
                        if (complete == 1)
                            animationComplete();

                    })
                }
                function animateSlideDown() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: frameWidth,
                        height: frameHeight,
                        left: 0,
                        top: -frameHeight,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 0
                    });
                    sliderContainer.append(cImage);
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: frameWidth,
                            height: frameHeight,
                            left: 0,
                            top: 0,
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(previousImage) + ')',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            zIndex: 100
                        });
                        sliderContainer.append(pImage);
                    }
                    var complete = 0;
                    $('.quake-el', sliderContainer).animate({ top: '+=' + frameHeight, opacity: 1 }, animationSpeed, function () {

                        complete++;
                        if (complete == 1)
                            animationComplete();

                    })
                }
                function animateSlideUp() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: frameWidth,
                        height: frameHeight,
                        left: 0,
                        top: frameHeight,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 0
                    });
                    sliderContainer.append(cImage);
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: frameWidth,
                            height: frameHeight,
                            left: 0,
                            top: 0,
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(previousImage) + ')',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            zIndex: 100
                        });
                        sliderContainer.append(pImage);
                    }
                    sliderContainer.append(cImage).append(pImage);
                    var complete = 0;
                    //setTimeout(function () {
                    $('.quake-el', sliderContainer).animate({ top: '-=' + frameHeight, opacity: 1 }, animationSpeed, function () {
                        complete++;
                        if (complete == 1)
                            animationComplete();
                    })
                    //}, 100);
                }

                function animationComplete() {
                    $('.quake-dn', sliderContainer).remove();
                    $('.quake-el', sliderContainer).removeClass('quake-el').addClass('quake-dn').css('z-index', '0');
                    $('.quake-fi').removeClass('quake-fi').addClass('quake-dn').css('z-index', '0');

                    if (currentImage.is('a'))//its a link, respond appropriately
                        sliderContainer.find('.quake-link').css({ 'display': 'block' }).attr('href', currentImage.attr('href')).attr('target', currentImage.attr('target'));
                    else
                        sliderContainer.find('.quake-link').css({ 'display': 'none' }).attr('href', '#');
                    isAnimating = false;
                }
                //Utility functions
                function swapDirection(index) {
                    if (index % cols == 0) {
                        currentRow++;
                        if (direction == 'forward')
                            direction = 'backward';
                        else
                            direction = 'forward';
                    }
                }
                function createBoxes() {
                    var w = frameWidth / cols;
                    var h = frameHeight / rows;
                    if (w % 10 > 0) {
                        w = parseInt(w);
                        w++;
                    }
                    if (h % 10 > 0) {
                        h = parseInt(h);
                        h++;
                    }
                    var totalBoxes = cols * rows;
                    timeFactor = animationSpeed / totalBoxes;
                    for (var i = 0; i < rows; i++) {
                        for (var j = 0; j < cols; j++) {
                            var box = $('<div/>').css({
                                width: w + 'px',
                                'height': h + 'px',
                                'top': (i * h) + 'px',
                                'left': (j * w) + 'px',
                                position: 'absolute',
                                backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: '' + (j * -w) + 'px ' + (i * -h) + 'px'
                            }).addClass('quake-el').hide();
                            sliderContainer.append(box);
                        }
                    }

                    $(".quake-el", sliderContainer).each(function (index) {
                        var pos = { left: $(this).css('left'), top: $(this).css('top') };
                        coordinates.push(pos);
                    });
                }
                function getImageSrc(ctrl) {
                    if (ctrl.is('img')) {
                        return ctrl.attr('src');
                    }
                    else if (ctrl.is('a') && ctrl.children().is('img'))
                        return ctrl.children().attr('src');

                }
                function createCircles(imageIndex) {
                    //image index will be equal to currentImage for swirlFadeIn, which has waves effect
                    //incrementing minCircumeference to one will remove the wave effect, so, before incrementing
                    //check whether its fade in or fade out animation, which is determined by comparing imageIndex with currentImage
                    minCircumeference = frameWidth / circles;
                    if (minCircumeference % 2 != 0 && imageIndex != currentImageIndex) minCircumeference++;
                    zindex = 100;
                    timeFactor = animationSpeed / circles;
                    for (var i = 0; i < circles; i++) {
                        var op = i + 1;
                        op /= 10;
                        var width = (i + 1) * minCircumeference;
                        var positionLeft = centerLeft - width / 2;
                        var positionTop = centerTop - width / 2;
                        var radius = (i + 1) * minCircumeference;
                        var box = $('<div/>').css({ backgroundImage: 'url(' + getImageSrc(images[imageIndex]) + ')', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', left: positionLeft, top: positionTop, position: 'absolute', width: width, height: width, zIndex: zindex--, opacity: 0 }).addClass('quake-el');

                        sliderContainer.append(box);
                    }
                }
                //Utility functions end here
                var currentEffect = "randomFade";
                function animateCaption() {
                    if (captions.length > currentImageIndex) {
                        var orientationsCount = settings.captionOrientations.length;
                        var orientation = settings.captionOrientations[orientationsCount - 1];
                        if (currentImageIndex < orientationsCount)
                            orientation = settings.captionOrientations[currentImageIndex];

                        captionContainer.removeAttr('style').removeClass('quake-slider-caption-container-left')
                                            .removeClass('quake-slider-caption-container-top')
                                            .removeClass('quake-slider-caption-container-bottom')
                                            .removeClass('quake-slider-caption-container-right');

                        captionContainer.parent().find('.quake-slider-caption').remove();
                        var caption = captions.eq(currentImageIndex).removeAttr('style').css('opacity', '0').removeClass('quake-slider-caption-right')
                                                                                            .removeClass('quake-slider-caption-left')
                                                                                            .removeClass('quake-slider-caption-top')
                                                                                            .removeClass('quake-slider-caption-bottom')                        //.addClass('quake-slider-caption-' + orientation);
                        captionContainer.after(caption);
                        if (settings.captionsSetup == null) {
                            captionDefaultAnimation(captionContainer, caption, orientation);
                        }
                        else//call custom callback
                        {
                            var config = getConfiguration(currentImageIndex);
                            if (config != null) {
                                if (config.orientation != null) orientation = config.orientation;
                                captionContainer.addClass('quake-slider-caption-container-' + orientation).show().css('opacity', settings.captionOpacity);
                                caption.addClass('quake-slider-caption-' + orientation).css({ opacity: 1 });
                                if (config.callback != null)
                                    config.callback(captionContainer, caption, orientation);
                                else
                                    captionDefaultAnimation(captionContainer, caption, orientation);
                            }
                            else
                                captionDefaultAnimation(captionContainer, caption, orientation);
                        }

                    }
                    else {
                        captionContainer.stop(true, true).animate({ opacity: 0 }, settings.captionAnimationSpeed, function () {
                            $(this).parent().find('.quake-slider-caption').remove();
                        });
                    }
                }
                //                function getConfiguration(orientation) {
                //                    if (settings.captionsSetup == null) return null;
                //                    var setups = eval(settings.captionsSetup);
                //                    for (var i = 0; i < setups.length; i++) {
                //                        if (setups[i].orientation == orientation)
                //                            return setups[i];
                //                    }
                //                    return null;
                //                }
                function getConfiguration(slide) {
                    if (settings.captionsSetup == null) return null;
                    var setups = eval(settings.captionsSetup);
                    for (var i = 0; i < setups.length; i++) {
                        if (setups[i].slides != null) {
                            if ($.inArray(slide, setups[i].slides) != -1)
                                return setups[i];
                        }
                    }
                    return null;
                }
                function captionDefaultAnimation(captionContainer, caption, orientation) {
                    captionContainer.addClass('quake-slider-caption-container-' + orientation).show().css('opacity', '0').stop(true, true).animate({ opacity: settings.captionOpacity }, settings.captionAnimationSpeed);
                    caption.addClass('quake-slider-caption-' + orientation).stop(true, true).animate({ opacity: 1 }, settings.captionAnimationSpeed);
                }
                function runAnimation() {

                    if (!isAnimating) {
                        isAnimating = true;
                        currentRow = 0;
                        var index = Math.floor(Math.random() * (effects.length));
                        currentEffect = effects[index];
                        if (currentEffect == undefined) currentEffect = 'randomFade';
                        //set active status
                        $('.quake-nav-container a').removeClass('active').eq(currentImageIndex).addClass('active');
                        //display caption                     

                        animateCaption();

                        currentImage = images[currentImageIndex];
                        //sliderContainer.find('.quake-full').css('z-index', '0');
                        switch (currentEffect) {
                            case 'randomFade':
                                animateRandomFade();
                                break;
                            case 'fade':
                                animateFade();
                                break;
                            case 'linearPeal':
                                animateLinearPeal();
                                break;
                            case 'linearPealReverse':
                                animateReversePeal();
                                break;
                            case 'swirlFadeIn':
                                animateSwirlFadeIn();
                                break;
                            case 'swirlFadeOut':
                                animateSwirlFadeOut();
                                break;
                            case 'diagonalFade':
                                animateDiagonally();
                                break;
                            case 'blind':
                                animateBlind();
                                break;
                            case 'blindFade':
                                animateBlindFade();
                                break;
                            case 'blindFadeReverse':
                                animateBlindFadeReverse();
                                break;
                            case 'explode':
                                animateExplode();
                                break;
                            case 'explodeFancy':
                                animateExplodeFancy();
                                break;
                            case 'barsUp':
                                animateBarUp();
                                break;
                            case 'barsDown':
                                animateBarDown();
                                break;
                            case 'mixBars':
                                animateMixBars();
                                break;
                            case 'mixBarsFancy':
                                animateMixBarsFancy();
                                break;
                            case 'slideIn':
                                animateSlideIn();
                                break;
                            case 'slideInFancy':
                                animateSlideInFancy();
                                break;
                            case 'slideLeft':
                                animateSlideLeft();
                                break;
                            case 'slideRight':
                                animateSlideRight();
                                break;
                            case 'slideUp':
                                animateSlideUp();
                                break;
                            case 'slideDown':
                                animateSlideDown();
                                break;
                            case 'fallingBlindFade':
                                animateFallingBlindFade();
                                break;
                            case 'raisingBlindFade':
                                animateRaisingBlindFade();
                                break;
                        }
                        previousImage = currentImage;
                        previousImageIndex = currentImageIndex;
                        currentImageIndex++;
                        if (currentImageIndex == images.length)
                            currentImageIndex = 0;
                    }


                }
            });
        }
    });
})(jQuery);