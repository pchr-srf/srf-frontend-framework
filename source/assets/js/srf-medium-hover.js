/*
 * This file handles the hover state of a medium molecule.
 * It can also be used on a media-still molecule if it is used as a standalone (=not a child of a medium) molecule.
 */
const HOOK_SELECTOR = '.js-medium-hover';

export function init() {
    // making sure that the binding only occurs once per molecule
    $(HOOK_SELECTOR + ' ' + HOOK_SELECTOR).removeClass(HOOK_SELECTOR);

    // hover for medium element
    $(document).on("mouseenter", HOOK_SELECTOR, (event) => {
        let $element = $(event.target.closest(HOOK_SELECTOR));
        $element.find('.media-caption').addClass('media-caption--hover');
        $element.find('.play-icon-ng').addClass('play-icon-ng--hover');
        $element.find('.media-still__image').addClass('media-still__image--hover');
    });

    $(document).on("mouseleave", HOOK_SELECTOR, (event) => {
        let $element = $(event.target.closest(HOOK_SELECTOR));
        $element.find('.media-caption').removeClass('media-caption--hover');
        $element.find('.play-icon-ng').removeClass('play-icon-ng--hover');
        $element.find('.media-still__image').removeClass('media-still__image--hover');
    });
}