import {DOM_CHANGED_EVENT} from '../classes/fef-dom-observer';

const ANIMATION_SPEED = 200;
const KEYCODES = {
    'enter': 13,
    'tab': 9,
    'escape': 27
};

let existingModals = {};

$(window).on(DOM_CHANGED_EVENT, (e) => {
    $('[data-modal-id]').each((index, element) => {

        $(element).on('click', () => {
            let $caller = $(element);
            let modalId = $caller.attr('data-modal-id');
            let $modalElement = $(`[data-id=${modalId}]`);

            if (existingModals[modalId]) {
                existingModals[modalId].show();
            } else if ($modalElement.length > 0) {
                existingModals[modalId] = new FefModal($modalElement, $caller);
            }
        });
    });
});

/**
 * Handles showing and hiding a modal element
 */
export class FefModal {

    /**
     * @param $element jQuery element
     * @param $caller jQuery element
     */
    constructor($element, $caller) {
        this.$element = $element;
        this.$caller = $caller;
        this.$focusTarget = this.$element.find('.js-focus-target');
        this.$mainWrapper = this.$element.find('.js-modal-main-wrapper');
        this.$mainContent = this.$element.find('.js-modal-main-content');
        this.animation = this.$element.attr('data-animation');

        this.bindEvents();

        if (this.$element.hasClass('js-min-height-of-masthead')) {
            this.$mainContent.css('min-height', $('.js-masthead').outerHeight());
        }

        this.show();
    }

    /**
     * Binds the relevant events for this modal:
     * - Click on a close-button or the overlay
     * - Pressing Escape
     */
    bindEvents() {
        this.$element.find('.js-close-modal, .js-modal-overlay').on('click', () => {
            this.close();
        });

        this.$element.on('keydown', (e) => {
            if (e.keyCode === KEYCODES.escape) {
                this.close();
            }
        });
    }

    /**
     * Show the modal, depending on the provided animation.
     */
    show() {
        switch (this.animation) {
            case 'scale-from-origin':
                this.scaleFromOrigin();
            case 'fade-in-out':
                this.$element.stop(true, true).fadeIn(ANIMATION_SPEED);
                break;
            default:
                this.$element.show();
                break;
        }

        if (this.$focusTarget.length === 1) {
            this.setFocus(this.$focusTarget);
        }
    }

    /**
     * Hide the modal, depending on the provided animation.
     */
    close() {
        switch (this.animation) {
            case 'fade-in-out':
                this.$element.stop(true, true).fadeOut(ANIMATION_SPEED);
                break;
            default:
                this.$element.hide();
                break;
        }

        this.setFocus(this.$caller);
    }

    /**
     * Simply using .focus() doesn't suffice.
     *
     * @param $element jQuery.Element
     */
    setFocus($element) {
        $element.attr('tabindex', -1).on('blur focusout', () => {
            $element.removeAttr('tabindex');
        }).focus();
    }

    /**
     * Fancy menu opening animation:
     * - fades the modal in
     * - 'opens' it from the originating element
     * - fades in the content (otherwise it'll be resized)
     *
     * For aesthetical reasons we have to animate to the previous height and not 100% max-height directly.
     */
    scaleFromOrigin() {
        this.$mainContent.css('opacity', 0);
        this.$element.show();

        let originalHeight = this.$mainWrapper.height();
        let box = this.$caller[0].getBoundingClientRect();

        this.$mainWrapper.css({
            'left': box.left,
            'width': box.width,
            'max-height': box.height,
            'top': box.top,
            'opacity': 0
        }).animate({
            'left': 0,
            'width': '100%',
            'max-height': originalHeight,
            'top': 0,
            'opacity': 1
        }, ANIMATION_SPEED, 'easeInOutSine', () => {
            // unset width so that the CSS rules work again to hide the scrollbars (see .modal-main-wrapper styles)
            this.$mainWrapper.css({
                'max-height': '100%',
                'width': ''
            });
            this.$mainContent.animate({
                'opacity': 1
            }, ANIMATION_SPEED);
        });
    }
}
