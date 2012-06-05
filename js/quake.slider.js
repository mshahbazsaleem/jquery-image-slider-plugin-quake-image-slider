/*********************************************

Author : EGrappler.com
URL    : http://www.egrappler.com
License: http://www.egrappler.com/license.

*********************************************/
(function ($) {
    $.fn.extend({
        quake: function (options) {
            var settings = $.extend({
                animationSpeed: 500,
                pauseTime: 4000,
                rows: 4,
                cols: 12,
                thumbnails: true,
                thumbnailsPath: '',
                applyEffectsRandomly: true,
                effects: ['swirlFadeOutRotate', 'swirlFadeOutRotateFancy', 'swirlFadeIn', 'swirlFadeOut', 'slabs', 'spiral', 'spiralReverse',
                'diagonalShow', 'diagonalShowReverse', 'spiralDimension', 'spiralReverseDimension', 'boxFadeIn', 'boxFadeOutOriginal',
                'boxFadeOutOriginalRotate', 'diagonalFade', 'diagonalFadeReverse',
                'randomFade', 'randomDimensions', 'boxes', 'explode', 'explodeFancy', 'linearPeal', 'linearPealReverse', 'linearPealDimensions',
                'linearPealReverseDimensions', 'blind', 'blindHorizontal', 'barsUp', 'barsDown', 'barsDownReverse',
                'blindFade', 'fallingBlindFade', 'raisingBlindFade', 'mixBars', 'mixBarsFancy', 'fade', 'blindFadeReverse', 'slideIn',
                'slideInFancy', 'slideInReverse', 'chop', 'chopDimensions', 'chopDiagonal', 'chopDiagonalReverse', 
                'slideLeft', 'slideRight', 'slideUp', 'slideDown'],
                nextText: 'Next',
                prevText: 'Prev',
                navPlacement: 'outside',
                navAlwaysVisible: false,
                hasNextPrev: true,
                captionOpacity: 0.5,
                captionOrientations: ['right'],
                captionAnimationSpeed: 1000,
                captionsSetup: null
            }, options);

            return this.each(function () {
                //local variables
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
                var sliderWidth = sliderContainer.width();
                var sliderHeight = sliderContainer.height();
                var theme = '';
                var wBars = cols * 2; //for horizontal effects
                var hBars = rows * 2; //for vertical effects
                var noOfBoxes = rows * cols; //for box animations
                var factor = 0;
                var complete = 0;

                var sliderWrapper = $('<div/>').addClass('quake-slider-wrapper');
                sliderWrapper.css({ 'width': sliderWidth, 'height': sliderHeight });
                if (!sliderContainer.hasClass('quake-slider'))
                    sliderContainer.addClass('quake-slider');
                sliderContainer.before(sliderWrapper);

                sliderWrapper.append(sliderContainer);

                sliderContainer.find('.quake-slider-images').css('display', 'none');
                captionContainer = sliderContainer.find('.quake-slider-captions').css('display', 'none').addClass('quake-slider-caption-container');

                if (sliderWidth % 2 != 0) circles--;

                centerLeft = sliderWidth / 2;
                centerTop = sliderHeight / 2;

                $(window).load(function () {
                    //once page is fully loaded, go ahead with slider    
                    $('link[href*="quake.skin.css"]').each(function () {
                        var skinParts = $(this).attr('href').split('/');
                        theme = skinParts[skinParts.length - 2];
                    });
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
                    captionContainer.css('opacity', settings.captionOpacity).html('');

                    sliderContainer.html('');
                    var link = $('<a/>').addClass('quake-link');
                    link.css('display', 'none');
                    link.css('width', sliderWidth);
                    link.css('height', sliderHeight);
                    sliderContainer.prepend(link);
                    if (settings.hasNextPrev) {
                        sliderWrapper.prepend(navContainer);
                        if (!settings.navAlwaysVisible) {
                            navContainer.hide();
                            sliderWrapper.mouseenter(function () { navContainer.show(); setupNavVisibility(true); }).mouseleave(function () { navContainer.hide(); setupNavVisibility(false); });
                        }
                        navContainer.find('.quake-prev').click(function () {
                            if (!isAnimating) {
                                stop();
                                currentImageIndex = previousImageIndex;
                                currentImageIndex -= 1;
                                if (currentImageIndex < 0)
                                    currentImageIndex = images.length - 1;
                                runAnimation();
                                start();
                            }
                        });

                        navContainer.find('.quake-next').click(function () {
                            if (!isAnimating) {
                                stop();
                                runAnimation();
                                start();
                            }
                        });
                    }
                    else {
                        if (!settings.navAlwaysVisible) {
                            sliderWrapper.mouseenter(function () { setupNavVisibility(true); }).mouseleave(function () { setupNavVisibility(false); });
                        }
                    }
                    sliderWrapper.mouseenter(stop).mouseleave(start);
                    if (theme == 'violet')
                        sliderWrapper.append(captionContainer);
                    else
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
                function setupNavVisibility(show) {
                    if (settings.navPlacement == 'inside') {
                        if (show)
                            sliderWrapper.find('.quake-nav-wrapper').show();

                        else
                            sliderWrapper.find('.quake-nav-wrapper').hide();
                    }
                }
                function addNavigationControls() {
                    var navWrapper = $('<div/>').addClass('quake-nav-wrapper ' + settings.navPlacement + '');
                    var nav = $('<div/>').addClass('quake-nav-container');
                    navWrapper.append(nav);
                    if (settings.hasNextPrev && !settings.navAlwaysVisible)
                        navWrapper.hide();
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
                        var twidth = thumbnail.find('.quake-thumbnail-preview').width();
                        var theight = thumbnail.find('.quake-thumbnail-preview').height();

                        var ar = sliderWidth / sliderHeight;
                        var ar1 = twidth / theight;
                        if (ar - ar1 > 1) {
                            ar = (ar + ar1) / (ar - ar1);
                        }
                        if (ar > 0)
                            twidth = ar * theight;

                        $('.quake-nav-container a').live('mouseenter', function () {
                            var center = $(this).position().left + $(this).outerWidth() / 2;
                            var left = center - thumbnail.outerWidth() / 2;
                            var top = $(this).position().top - thumbnail.outerHeight();
                            //set img source, take it from thumbnails directory
                            var img = images[parseInt($(this).html())];

                            if (img != null) {
                                var imgPath = getImageSrc(img);
                                if (settings.thumbnailsPath != '') {
                                    var parts = getImageSrc(img).split('/');
                                    imgPath = settings.thumbnailsPath + '/' + parts[parts.length - 1];
                                }
                                thumbnail.find('img').attr('src', imgPath).css({ width: twidth, height: theight });
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
                function animateRandomFadeDimensions() {
                    createBoxes();
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    $(".quake-el").css({ width: 0, height: 0, opacity: 0, display: 'block' });
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
                                    el.animate({ opacity: 1, width: w, height: h }, animationSpeed, function () {
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
                function animateBoxes() {
                    createBoxes();
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    $(".quake-el").css({ width: 0, height: 0, opacity: 0, display: 'block' });

                    $(".quake-el").each(function (index) {
                        //if (complete < randomElements.length) {
                        var el = $(this);
                        //setTimeout(function () {
                        try {
                            el.animate({ opacity: 1, width: w, height: h }, animationSpeed, function () {
                                complete++;
                                if (complete == noOfBoxes) {
                                    animationComplete();
                                }
                            });
                        }
                        catch (ex) { }
                        //}, factor);
                        factor += timeFactor * 2;
                        //}
                    });
                }
                function animateLinearPealDimensions() {
                    createBoxes();
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    $('.quake-el', sliderContainer).each(function () {
                        var el = $(this);
                        setTimeout(function () {
                            el.css({ width: 0, height: 0, opacity: 1, display: 'block' }).animate({ width: w, height: h }, animationSpeed, function () {
                                complete++;
                                if (complete == noOfBoxes) {
                                    animationComplete();
                                }
                            });
                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function animateReversePealDimensions() {
                    createBoxes();
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    var indeces = new Array();
                    $('.quake-el', sliderContainer).each(function (index) {
                        swapDirection(index);
                        if (direction == 'forward') {
                            indeces.push(index);
                        }
                        else {
                            var en = (currentRow * cols - 1) + (((currentRow - 1) * cols) - index);
                            indeces.push(en);
                        }
                    });

                    $('.quake-el', sliderContainer).each(function (index) {
                        setTimeout(function () {
                            $('.quake-el:eq(' + indeces[index] + ')', sliderContainer).css({ width: 0, height: h, opacity: 1, display: 'block' }).animate({ width: w, height: h }, animationSpeed / 2, function () {
                                complete++;
                                if (complete == indeces.length) {
                                    animationComplete();
                                }
                            });

                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function animateLinearPeal() {
                    createBoxes();
                    $('.quake-el', sliderContainer).each(function () {
                        var el = $(this);
                        setTimeout(function () {
                            el.fadeIn(animationSpeed, function () {
                                complete++;
                                if (complete == noOfBoxes) {
                                    animationComplete();
                                }
                            });
                        }, factor * 1.3);
                        factor += timeFactor;
                    });
                }
                function animateReversePeal() {
                    createBoxes();
                    var indeces = new Array();
                    $('.quake-el', sliderContainer).each(function (index) {
                        swapDirection(index);
                        if (direction == 'forward') {
                            indeces.push(index);
                        }
                        else {
                            var en = (currentRow * cols - 1) + (((currentRow - 1) * cols) - index);
                            indeces.push(en);
                        }
                    });

                    $('.quake-el', sliderContainer).each(function (index) {
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

                function animateSpiral(reverse, animateSize) {
                    createBoxes();
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    //create a two dimentional array using rows and colmns, then transform arry to spiral
                    if (animateSize)
                        $('.quake-el', sliderContainer).css({ width: 0, height: 0, opacity: 1 });
                    var twoDArr = new Array();
                    var val = 0;
                    for (var i = 0; i < rows; i++) {
                        var subArray = new Array();
                        twoDArr.push(subArray);
                        for (var j = 0; j < cols; j++) {
                            subArray.push(val);
                            val++;
                        }
                    }
                    var indeces = new Array();
                    indeces = spiralify(twoDArr);
                    if (reverse) indeces.reverse();

                    $('.quake-el', sliderContainer).each(function (index) {
                        setTimeout(function () {
                            if (!animateSize) {
                                $('.quake-el:eq(' + indeces[index] + ')', sliderContainer).fadeIn(animationSpeed / 2, function () {
                                    complete++;
                                    if (complete == indeces.length) {
                                        animationComplete();
                                    }
                                });
                            }
                            else {
                                $('.quake-el:eq(' + indeces[index] + ')', sliderContainer).show().animate({ width: w, height: h }, animationSpeed / 2, function () {
                                    complete++;
                                    if (complete == indeces.length) {
                                        animationComplete();
                                    }
                                });
                            }

                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }

                function animateSwirlFadeIn() {
                    createCircles(currentImageIndex);
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
                function animateBoxFadeOutOriginal(rotate) {
                    if (previousImage == null) previousImage = images[images.length - 1];
                    var divImage = $('<div/>').css({
                        zIndex: 1,
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                    }).addClass('quake-fi');

                    createCircles(previousImageIndex);
                    sliderContainer.append(divImage);

                    var boxes = $('.quake-el', sliderContainer).css('opacity', 1).length;
                    var widthFactor = sliderWidth / animationSpeed;
                    var angle = 0;
                    if (rotate) angle = 360;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ opacity: 0, scale: '-=1', rotate: '+=' + angle + 'deg' }, animationSpeed, function () {
                                complete++;
                                if (complete == boxes - 1) {
                                    animationComplete();
                                }
                            });
                        }, factor);
                        factor += timeFactor;
                    });
                }

                function animateBoxFadeIn() {
                    var boxes = circles * 2;
                    var imageIndex = currentImageIndex;
                    minCircumeference = sliderWidth / boxes;
                    minCircumeference++;
                    zindex = 100;
                    timeFactor = animationSpeed / circles;
                    for (var i = 0; i < boxes; i++) {
                        var op = i + 1;
                        op /= boxes;
                        var width = (i + 1) * minCircumeference;
                        var positionLeft = centerLeft - width / 2;
                        var positionTop = centerTop - width / 2;
                        var radius = (i + 1) * minCircumeference;
                        var box = $('<div/>').css({ backgroundImage: 'url(' + getImageSrc(images[imageIndex]) + ')', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', left: positionLeft, top: positionTop, position: 'absolute', width: width, height: width, opacity: 0 }).addClass('quake-el');

                        sliderContainer.append(box);
                    }
                    var radea = new Array();
                    $('.quake-el', sliderContainer).each(function (index) {
                        radea.push(minCircumeference * (index + 1));
                    });
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ opacity: 1 }, animationSpeed, function () {
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

                    }).addClass('quake-fi');

                    createCircles(previousImageIndex);
                    $('.quake-el', sliderContainer).css({ 'opacity': 1, zIndex: 2 });

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
                function animateSwirlFadeOutRotate(toggle) {
                    var divImage = $('<div/>').css({
                        zIndex: 1,
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        width: '100%',
                        height: '100%'

                    }).addClass('quake-fi');

                    createCircles(previousImageIndex);
                    $('.quake-el', sliderContainer).css({ 'opacity': 1 });
                    var radea = new Array();
                    var elements = new Array();
                    $('.quake-el', sliderContainer).css('background-repeat', 'repeat').each(function (index) {
                        $(this).css({ borderRadius: minCircumeference * (index + 1) });
                        elements.push(index);
                    });
                    sliderContainer.append(divImage);
                    elements = elements.reverse();
                    var total = elements.length;
                    var degree = 20;
                    $(elements).each(function (element, index) {
                        var el = $('.quake-el', sliderContainer).eq(element);
                        degree += 5;
                        var angle = degree;
                        if (toggle)
                            if (index % 2 != 0) angle = -degree;
                        factor = 100 * index;
                        setTimeout(function () {
                            el.animate({ opacity: 0, rotate: angle + 'deg' }, animationSpeed, function () {
                                complete++;
                                if (complete == total - 1)
                                    animationComplete();
                            });

                        }, factor);
                    });
                }

                function animateDiagonally(reverse, animateSize) {

                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);

                    for (var row = 0; row < rows; row++) {
                        for (var col = 0; col < cols; col++) {
                            $('<div/>').addClass('quake-el').css({
                                width: animateSize ? 0 : w,
                                height: animateSize ? 0 : h,
                                left: Math.ceil(col * w),
                                top: Math.ceil(row * h),
                                position: 'absolute',
                                opacity: animateSize ? 1 : 0,
                                backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                                backgroundPosition: '' + (-(col * w)) + 'px ' + (-(row * h)) + 'px'
                            }).appendTo(sliderContainer);
                        }
                    }
                    timeFactor = animationSpeed / noOfBoxes;
                    var diagonal = new Array();
                    for (var i = 0; i < rows + cols - 1; i++) {
                        diagonal.push(i);
                        diagonal[i] = new Array();
                        for (var j = Math.min(rows, i + 1) - 1; j >= Math.max(0, i - cols + 1); j--) {
                            diagonal[i].push((j * cols) + i - j);
                        }
                    }
                    if (reverse) diagonal.reverse();
                    $(diagonal).each(function (index, elements) {
                        setTimeout(function () {
                            $(elements).each(function (i, val) {
                                $('.quake-el:eq(' + val + ')').animate({ opacity: 1, width: w, height: h }, animationSpeed, function () {
                                    complete++;
                                    if (complete == noOfBoxes) {
                                        animationComplete();
                                    }
                                });
                            });

                        }, factor * 6);
                        factor += timeFactor;
                    });
                }

                function animateBlind() {
                    var bars = wBars;
                    var w = sliderWidth / bars;
                    if (w % 10 != 0) w++;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: 0,
                            height: sliderHeight,
                            left: Math.ceil((i * sliderWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px'
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

                function animateSlabs() {
                    var bars = wBars;
                    var w = sliderWidth / bars;
                    if (w % 10 != 0) w++;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: w,
                            height: sliderHeight,
                            left: -w,
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var i = bars - index;
                        var el = $('.quake-el', sliderContainer).eq(i);
                        var left = Math.ceil((i * sliderWidth / bars));
                        setTimeout(function () {
                            el.animate({ left: left, opacity: 1 }, animationSpeed);
                        }, factor);
                        factor += timeFactor;
                    });
                    factor -= timeFactor;
                    setTimeout(function () {
                        $('.quake-el', sliderContainer).eq(0).animate({ left: 0, opacity: 1 }, animationSpeed, animationComplete);
                    }, factor);
                }

                function animateBlindHorizontal() {
                    var bars = hBars;
                    var h = sliderHeight / bars;
                    if (h % 10 != 0) h++;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: sliderWidth,
                            height: 0,
                            top: Math.ceil((i * sliderHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-(i * sliderHeight / bars)) + 'px'
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ height: h }, animationSpeed, function () {
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
                    var bars = wBars;
                    var w = sliderWidth / bars;
                    if (w % 10 != 0) w += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: w,
                            height: sliderHeight,
                            left: Math.ceil((i * sliderWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px',
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
                    var bars = wBars;
                    var w = sliderWidth / bars;
                    if (w % 10 != 0) w += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: w,
                            height: sliderHeight,
                            left: Math.ceil((i * sliderWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px',
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
                    var bars = hBars;
                    var h = sliderHeight / bars;
                    if (h % 10 != 0) h += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: sliderWidth,
                            height: h,
                            left: 0,
                            top: Math.ceil((i * sliderHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-(i * sliderHeight / bars)) + 'px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars) {
                                    animationComplete();
                                }
                            });

                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateRaisingBlindFade() {
                    var bars = hBars;
                    var h = sliderHeight / bars;
                    if (h % 10 != 0) h += 1;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({
                            width: sliderWidth,
                            height: h,
                            left: 0,
                            top: Math.ceil((i * sliderHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-(i * sliderHeight / bars)) + 'px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    timeFactor = animationSpeed / bars;
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $('.quake-el', sliderContainer).eq((bars - (index + 1))); //$(this);
                        setTimeout(function () {
                            el.animate({ opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars) {
                                    animationComplete();
                                }
                            });

                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateMixBars() {
                    var bars = wBars;
                    timeFactor = animationSpeed / bars;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(sliderWidth / bars),
                            height: sliderHeight,
                            marginTop: (i % 2 == 0) ? -(sliderHeight) : sliderHeight,
                            left: Math.ceil((i * sliderWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px',
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
                    var bars = wBars;
                    timeFactor = animationSpeed / bars;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(sliderWidth / bars),
                            height: sliderHeight,
                            marginTop: (i % 2 == 0) ? -(sliderHeight) : sliderHeight,
                            left: Math.ceil((i * sliderWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px',
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
                function animateBarsDown(reverse) {
                    var bars = wBars;
                    timeFactor = animationSpeed / bars;
                    if (previousImage == null) previousImage = currentImage;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(sliderWidth / bars),
                            height: sliderHeight,
                            marginTop: reverse ? 0 : -(sliderHeight),
                            left: Math.ceil((i * sliderWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(reverse ? previousImage : currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px',
                            opacity: 0
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }

                    var divImage = $('<div/>').css({
                        zIndex: 0,
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                    }).addClass('quake-fi');

                    if (reverse) {
                        $('.quake-el', sliderContainer).css({ 'opacity': 1, zIndex: 2 });
                        sliderContainer.append(divImage);
                    }
                    $('.quake-el', sliderContainer).each(function (index) {
                        var el = $(this);
                        setTimeout(function () {
                            el.animate({ marginTop: (reverse ? -sliderHeight : 0), opacity: 1 }, animationSpeed, function () {
                                complete++;
                                if (complete == bars - 1)
                                    animationComplete();
                            });
                        }, factor * 1.5);
                        factor += timeFactor;
                    });
                }
                function animateBarUp() {
                    var bars = wBars;
                    timeFactor = animationSpeed / bars;
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: Math.ceil(sliderWidth / bars),
                            height: sliderHeight,
                            marginTop: sliderHeight,
                            left: Math.ceil((i * sliderWidth / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '' + (-(i * sliderWidth / bars)) + 'px 0px',
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
                    timeFactor = animationSpeed / noOfBoxes;
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    var coordinates = new Array();
                    for (var row = 0; row < rows; row++) {
                        for (var col = 0; col < cols; col++) {
                            $('<div/>').css({
                                width: w, height: h,
                                left: Math.ceil((sliderWidth / 2 - w / 2)),
                                top: Math.ceil((sliderHeight / 2 - h / 2)),
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
                            if (complete == noOfBoxes)
                                animationComplete();
                        });
                        factor += timeFactor;
                    });
                }
                function animateExplodeFancy() {
                    timeFactor = animationSpeed / noOfBoxes;
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    var coordinates = new Array();
                    for (var row = 0; row < rows; row++) {
                        for (var col = 0; col < cols; col++) {
                            $('<div/>').css({
                                width: 0, height: 0,
                                left: Math.ceil((sliderWidth / 2 - w / 2)),
                                top: Math.ceil((sliderHeight / 2 - h / 2)),
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
                                if (complete == noOfBoxes) {
                                    animationComplete();
                                }
                            });
                        }, factor * 2);
                        factor += timeFactor;
                    });
                }
                function animateFade() {
                    $('<div/>').css({
                        width: sliderWidth,
                        height: sliderHeight,
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 100,
                        opacity: 0
                    }).addClass('quake-el').appendTo(sliderContainer);

                    $('.quake-el', sliderContainer).animate({ opacity: 1 }, animationSpeed * 2, function () {
                        animationComplete();
                    });
                }

                function animateSlideIn(reverse) {
                    var bars = hBars;
                    //reconsider this condition
                    if (wBars - hBars >= wBars / 2) {
                        bars += (hBars / 2);
                    }
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: sliderWidth,
                            height: Math.ceil(sliderHeight / bars),
                            marginLeft: reverse ? sliderWidth : -sliderWidth,
                            top: Math.ceil((i * sliderHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-Math.ceil((i * sliderHeight / bars))) + 'px',
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
                    var bars = hBars;
                    //reconsider this condition
                    if (wBars - hBars >= wBars / 2) {
                        bars += (hBars / 2);
                    }
                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: sliderWidth,
                            height: Math.ceil(sliderHeight / bars),
                            marginLeft: (i % 2 == 0) ? -sliderWidth : sliderWidth,
                            top: Math.ceil((i * sliderHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                            backgroundPosition: '0px ' + (-Math.ceil((i * sliderHeight / bars))) + 'px',
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
                function animateChop(animateSize, diagonal, reverse) {
                    var w = Math.ceil(sliderWidth / cols);
                    var h = Math.ceil(sliderHeight / rows);
                    var bars = hBars / 2;
                    //reconsider this condition
                    if (wBars - hBars >= wBars / 2) {
                        bars += (hBars / 2);
                    }
                    if (previousImage == null) previousImage = images[images.length - 1];
                    var divImage = $('<div/>').css({
                        zIndex: 0,
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        display: 'none'
                    }).addClass('quake-fi');

                    for (var i = 0; i < bars; i++) {
                        $('<div/>').css({ width: sliderWidth,
                            height: Math.ceil(sliderHeight / bars),
                            top: Math.ceil((i * sliderHeight / bars)),
                            position: 'absolute',
                            backgroundImage: 'url(' + getImageSrc(previousImage) + ')',
                            backgroundPosition: '0px ' + (-Math.ceil((i * sliderHeight / bars))) + 'px',
                            zIndex: 2
                        }).addClass('quake-el').appendTo(sliderContainer);
                    }
                    divImage.css('display', 'block');
                    sliderContainer.append(divImage);
                    timeFactor = animationSpeed / bars;

                    $('.quake-el', sliderContainer).each(function (i, el) {
                        var el = $(this);
                        var ml = (i % 2 == 0) ? -sliderWidth : sliderWidth;
                        setTimeout(function () {
                            if (animateSize) {
                                el.animate({ marginLeft: ml, opacity: 1, height: 0, width: 0 }, animationSpeed, function () {
                                    complete++;
                                    if (complete == bars)
                                        animationComplete();
                                });
                            }
                            else {
                                if (diagonal) ml = sliderWidth;
                                if (reverse) ml = -sliderWidth;
                                el.animate({ marginLeft: ml, opacity: 1 }, animationSpeed, function () {
                                    complete++;
                                    if (complete == bars)
                                        animationComplete();
                                });
                            }
                        }, factor);

                        factor += timeFactor;
                    });
                }
                function animateSlideLeft() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: sliderWidth,
                        height: sliderHeight,
                        left: sliderWidth,
                        top: 0,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 1
                    });
                    sliderContainer.append(cImage)
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: sliderWidth,
                            height: sliderHeight,
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
                    $('.quake-el', sliderContainer).animate({ left: '-=' + sliderWidth, opacity: 1 }, animationSpeed, function () {

                        complete++;
                        if (complete == 1)
                            animationComplete();
                    })
                }

                function animateSlideRight() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: sliderWidth,
                        height: sliderHeight,
                        left: -sliderWidth,
                        top: 0,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 1
                    });
                    sliderContainer.append(cImage);
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: sliderWidth,
                            height: sliderHeight,
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
                    $('.quake-el', sliderContainer).animate({ left: '+=' + sliderWidth, opacity: 1 }, animationSpeed, function () {
                        complete++;
                        if (complete == 1)
                            animationComplete();
                    })
                }
                function animateSlideDown() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: sliderWidth,
                        height: sliderHeight,
                        left: 0,
                        top: -sliderHeight,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 1
                    });
                    sliderContainer.append(cImage);
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: sliderWidth,
                            height: sliderHeight,
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
                    $('.quake-el', sliderContainer).animate({ top: '+=' + sliderHeight, opacity: 1 }, animationSpeed, function () {
                        complete++;
                        if (complete == 1)
                            animationComplete();
                    })
                }
                function animateSlideUp() {
                    var cImage = $('<div/>').addClass('quake-el').css({
                        width: sliderWidth,
                        height: sliderHeight,
                        left: 0,
                        top: sliderHeight,
                        position: 'absolute',
                        backgroundImage: 'url(' + getImageSrc(currentImage) + ')',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 100,
                        opacity: 1
                    });
                    sliderContainer.append(cImage);
                    if (previousImage != null) {
                        var pImage = $('<div/>').addClass('quake-el').css({
                            width: sliderWidth,
                            height: sliderHeight,
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
                    $('.quake-el', sliderContainer).animate({ top: '-=' + sliderHeight, opacity: 1 }, animationSpeed, function () {
                        complete++;
                        if (complete == 1)
                            animationComplete();
                    });
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
                function hideIt(i) {
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
                            $('.quake-el', sliderContainer).animate({ opacity: 0 }, animationSpeed);
                            setTimeout(animationComplete, (animationSpeed + 1));
                        }
                    });
                }
                //Excellent out of the box code form Jordan http://codereview.stackexchange.com/users/7249/jordan

                function spiralify(matrix) {
                    // stop case--if there is only one row, return the row
                    if (matrix.length == 1) {
                        return matrix[0];
                    }

                    var firstRow = matrix[0]
                            , numRows = matrix.length

                    // we're going to rotate the remaining rows and put them
                    // in this new array
                            , nextMatrix = []
                            , newRow
                            , rowIdx
                            , colIdx = matrix[1].length - 1;

                    // here's where we do the actual rotation

                    // take each column starting with the last and working backwards
                    for (colIdx; colIdx >= 0; colIdx--) {
                        // an array to store the rotated row we'll make from this column
                        newRow = [];

                        // take each row starting with 1 (the second)
                        for (rowIdx = 1; rowIdx < numRows; rowIdx++) {
                            // ...and add the item at colIdx to newRow
                            newRow.push(matrix[rowIdx][colIdx]);
                        }

                        nextMatrix.push(newRow);
                    }

                    // pass nextMatrix to spiralify and join the result to firstRow
                    firstRow.push.apply(firstRow, spiralify(nextMatrix));

                    return firstRow;
                }
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
                    var w = sliderWidth / cols;
                    var h = sliderHeight / rows;
                    if (w % 10 > 0) {
                        w = parseInt(w);
                        w++;
                    }
                    if (h % 10 > 0) {
                        h = parseInt(h);
                        h++;
                    }
                    timeFactor = animationSpeed / noOfBoxes;
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
                    minCircumeference = sliderWidth / circles;
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

                        captionContainer.removeAttr('style').removeClass('vertical left right bottom top horizontal');

                        captionContainer.parent().find('.quake-slider-caption').remove();
                        var caption = captions.eq(currentImageIndex).removeAttr('style').css('opacity', '0').removeClass('vertical left right bottom top horizontal');
                        captionContainer.after(caption);
                        if (settings.captionsSetup == null) {
                            captionDefaultAnimation(captionContainer, caption, orientation);
                        }
                        else//call custom callback
                        {
                            var config = getConfiguration(currentImageIndex);
                            if (config != null) {
                                if (config.orientation != null) orientation = config.orientation;
                                setOrientation(captionContainer, caption, orientation);
                                captionContainer.show().css('opacity', settings.captionOpacity);
                                caption.css({ opacity: 1 });
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
                function setOrientation(captionContainer, caption, orientation) {
                    var cls;
                    if (orientation == 'top') cls = 'horizontal top';
                    if (orientation == 'bottom') cls = 'horizontal bottom';
                    if (orientation == 'left') cls = 'vertical left';
                    if (orientation == 'right') cls = 'vertical right';
                    captionContainer.addClass('quake-slider-caption-container ' + cls);
                    caption.addClass('quake-slider-caption ' + cls);
                }
                function captionDefaultAnimation(captionContainer, caption, orientation) {
                    setOrientation(captionContainer, caption, orientation);
                    captionContainer.show().css('opacity', '0').stop(true, true).animate({ opacity: settings.captionOpacity }, settings.captionAnimationSpeed);
                    caption.stop(true, true).animate({ opacity: 1 }, settings.captionAnimationSpeed);
                }
                var initialized = false;
                var currentEffectIndex = 0;
                function runAnimation() {
                    if (!isAnimating) {
                        isAnimating = true;
                        currentRow = 0;
                        if (settings.applyEffectsRandomly) {
                            var index = Math.floor(Math.random() * (effects.length));
                            currentEffect = effects[index];
                        }
                        else
                            currentEffect = effects[currentEffectIndex];
                        if (currentEffect == undefined) currentEffect = 'randomFade';
                        //set active status
                        $('.quake-nav-container a').removeClass('active').eq(currentImageIndex).addClass('active');
                        //display caption                  
                        animateCaption();
                        currentImage = images[currentImageIndex];
                        factor = 0;
                        complete = 0;
                        if (!initialized) { initialized = true; previousImageIndex = images.length - 1; }
                        switch (currentEffect) {
                            case 'slabs':
                                animateSlabs();
                                break;
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
                            case 'linearPealReverseDimensions':
                                animateReversePealDimensions();
                                break;
                            case 'swirlFadeIn':
                                animateSwirlFadeIn();
                                break;
                            case 'swirlFadeOut':
                                animateSwirlFadeOut();
                                break;
                            case 'diagonalFade':
                                animateDiagonally(false, false);
                                break;
                            case 'diagonalFadeReverse':
                                animateDiagonally(true, false);
                                break;
                            case 'diagonalShow':
                                animateDiagonally(false, true);
                                break;
                            case 'diagonalShowReverse':
                                animateDiagonally(true, true);
                                break;
                            case 'blind':
                                animateBlind();
                                break;
                            case 'blindHorizontal':
                                animateBlindHorizontal();
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
                                animateBarsDown(false);
                                break;
                            case 'barsDownReverse':
                                animateBarsDown(true);
                                break;
                            case 'mixBars':
                                animateMixBars();
                                break;
                            case 'mixBarsFancy':
                                animateMixBarsFancy();
                                break;
                            case 'slideIn':
                                animateSlideIn(false);
                                break;
                            case 'slideInReverse':
                                animateSlideIn(true);
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
                            case 'spiral':
                                animateSpiral(false, false);
                                break;
                            case 'spiralReverse':
                                animateSpiral(true, false);
                                break;
                            case 'spiralDimension':
                                animateSpiral(false, true);
                                break;
                            case 'spiralReverseDimension':
                                animateSpiral(true, true);
                                break;
                            case 'linearPealDimensions':
                                animateLinearPealDimensions();
                                break;
                            case 'chop':
                                animateChop(false, false, false);
                                break;
                            case 'chopDimensions':
                                animateChop(true, false, false);
                                break;
                            case 'chopDiagonal':
                                animateChop(false, true, false);
                                break;
                            case 'chopDiagonalReverse':
                                animateChop(false, false, true);
                                break;
                            case 'randomDimensions':
                                animateRandomFadeDimensions();
                                break;
                            case 'boxes':
                                animateBoxes();
                                break;
                            case 'swirlFadeOutRotate':
                                animateSwirlFadeOutRotate(false);
                                break;
                            case 'swirlFadeOutRotateFancy':
                                animateSwirlFadeOutRotate(true);
                                break;
                            case 'swirlFadeInDimensions':
                                animateSwirlFadeInDimensions();
                                break;
                            case 'boxFadeIn':
                                animateBoxFadeIn();
                                break;
                            case 'boxFadeOutOriginal':
                                animateBoxFadeOutOriginal(false);
                                break;
                            case 'boxFadeOutOriginalRotate':
                                animateBoxFadeOutOriginal(true);
                                break;
                        }
                        previousImage = currentImage;
                        previousImageIndex = currentImageIndex;
                        currentImageIndex++;
                        if (currentImageIndex == images.length)
                            currentImageIndex = 0;
                        currentEffectIndex++;
                        if (currentEffectIndex == effects.length)
                            currentEffectIndex = 0;
                        //if (!initialized) { initialized = true; currentEffectIndex = 0; }
                    }

                }
            });
        }
    });

    // Monkey patch jQuery 1.3.1+ to add support for setting or animating CSS
    // scale and rotation independently.
    // 2009-2010 Zachary Johnson www.zachstronaut.com
    // Updated 2010.11.06
    var rotateUnits = 'deg';

    $.fn.rotate = function (val) {
        var style = $(this).css('transform') || 'none';
        if (typeof val == 'undefined') {
            if (style) {
                var m = style.match(/rotate\(([^)]+)\)/);
                if (m && m[1]) {
                    return m[1];
                }
            }
            return 0;
        }
        var m = val.toString().match(/^(-?\d+(\.\d+)?)(.+)?$/);
        if (m) {
            if (m[3]) rotateUnits = m[3];
            $(this).css('transform',
                style.replace(/none|rotate\([^)]*\)/, '') + 'rotate(' + m[1] + rotateUnits + ')'
            );
        }

        return this;
    };

    // Note that scale is unitless.
    $.fn.scale = function (val, duration, options) {
        var style = $(this).css('transform');
        if (typeof val == 'undefined') {
            if (style) {
                var m = style.match(/scale\(([^)]+)\)/);
                if (m && m[1]) {
                    return m[1];
                }
            }
            return 1;
        }
        $(this).css('transform',
            style.replace(/none|scale\([^)]*\)/, '') + 'scale(' + val + ')'
        );
        return this;
    };

    // fx.cur() must be monkey patched because otherwise it would always
    // return 0 for current rotate and scale values
    var curProxied = $.fx.prototype.cur;
    $.fx.prototype.cur = function () {
        if (this.prop == 'rotate') {
            return parseFloat($(this.elem).rotate());
        }
        else if (this.prop == 'scale') {
            return parseFloat($(this.elem).scale());
        }
        return curProxied.apply(this, arguments);
    };

    $.fx.step.rotate = function (fx) {
        $(fx.elem).rotate(fx.now + rotateUnits);
    };

    $.fx.step.scale = function (fx) {
        $(fx.elem).scale(fx.now);
    };

    var animateProxied = $.fn.animate;
    $.fn.animate = function (prop) {
        if (typeof prop['rotate'] != 'undefined') {
            var m = prop['rotate'].toString().match(/^(([+-]=)?(-?\d+(\.\d+)?))(.+)?$/);
            if (m && m[5]) {
                rotateUnits = m[5];
            }
            prop['rotate'] = m[1];
        }

        return animateProxied.apply(this, arguments);
    };

    // Monkey patch jQuery 1.3.1+ css() method to support CSS 'transform'
    // property uniformly across Safari/Chrome/Webkit, Firefox 3.5+, IE 9+, and Opera 11+.
    // 2009-2011 Zachary Johnson www.zachstronaut.com
    // Updated 2011.05.04 (May the fourth be with you!)
    function getTransformProperty(element) {
        var properties = ['transform', 'WebkitTransform', 'msTransform', 'MozTransform', 'OTransform'];
        var p;
        while (p = properties.shift()) {
            if (typeof element.style[p] != 'undefined') {
                return p;
            }
        }
        return 'transform';
    };

    var _propsObj = null;

    var proxied = $.fn.css;
    $.fn.css = function (arg, val) {
        if (_propsObj === null) {
            if (typeof $.cssProps != 'undefined') {
                _propsObj = $.cssProps;
            }
            else if (typeof $.props != 'undefined') {
                _propsObj = $.props;
            }
            else {
                _propsObj = {};
            }
        }
        if
        (
            typeof _propsObj['transform'] == 'undefined'
            &&
            (
                arg == 'transform'
                ||
                (
                    typeof arg == 'object'
                    && typeof arg['transform'] != 'undefined'
                )
            )
        ) {
            _propsObj['transform'] = getTransformProperty(this.get(0));
        }
        if (_propsObj['transform'] != 'transform') {
            if (arg == 'transform') {
                arg = _propsObj['transform'];
                if (typeof val == 'undefined' && jQuery.style) {
                    return jQuery.style(this.get(0), arg);
                }
            }
            else if
            (
                typeof arg == 'object'
                && typeof arg['transform'] != 'undefined'
            ) {
                arg[_propsObj['transform']] = arg['transform'];
                delete arg['transform'];
            }
        }
        return proxied.apply(this, arguments);
    };
})(jQuery);