/**
 * Just a little convenient function to fade out an element
 */
(function () {
    window.OC = {};

    OC.fadeOut = function (_elementName) {
        var elementStyle = document.getElementById(_elementName).style;

        (function fade() {
            (elementStyle.opacity -= .1) < 0 ? elementStyle.display = "none" : setTimeout(fade, 40);
        })();

    }
}());