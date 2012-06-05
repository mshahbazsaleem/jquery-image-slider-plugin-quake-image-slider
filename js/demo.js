$(document).ready(function () {
    $('.top-menu ul li ul').hide();

    $('.top-menu ul li:eq(1)').hover(function () {
        $('.top-menu ul li ul').stop(false, true).show('slow');
    }, function () {
        $('.top-menu ul li ul').stop(false, true).hide('slow');
    });
    // Change the image of hoverable images
    $(".imgHoverable").hover(function () {
        var hoverImg = HoverImgOf($(this).attr("src"));
        $(this).attr("src", hoverImg);
    }, function () {
        var normalImg = NormalImgOf($(this).attr("src"));
        $(this).attr("src", normalImg);
    }
	   );
});

function HoverImgOf(filename) {
    var re = new RegExp("(.+)\\.(gif|png|jpg)", "g");
    return filename.replace(re, "$1_hover.$2");
}
function NormalImgOf(filename) {
    var re = new RegExp("(.+)_hover\\.(gif|png|jpg)", "g");
    return filename.replace(re, "$1.$2");
}