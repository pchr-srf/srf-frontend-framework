import {FefDebounceHelper} from '../classes/fef-debounce-helper';
import {FefResponsiveHelper} from '../classes/fef-responsive-helper';

const HOOK_CLASS = 'js-swipeable-area',
    INNER_CONTAINER_CLASS = 'js-swipeable-area-wrapper',
    ITEM_CLASS = 'js-swipeable-area-item',
    BACK_BUTTON_CLASS = 'swipeable-area__button',
    FORWARD_BUTTON_CLASS = 'swipeable-area__button swipeable-area__button--forward',
    BUTTON_ACTIVE_CLASS = 'swipeable-area__button--active',
    BUTTON_BACK_THRESHOLD = 2,
    RIGHT_OFFSET = 24,
    INNER_CONTAINER_SCROLL_PADDING = 50,
    DEFAULT_SCROLL_TIME = 400,
    DEBOUNCETIME = 50,
    MIN_BUTTON_WIDTH = 40,
    MAX_BUTTON_WIDTH = 70;

export function init() {
    $(`.${HOOK_CLASS}`).each((index, element) => {
        new FefSwipeableArea($(element));
    });
}

/**
 * This component
 */
export class FefSwipeableArea {

    constructor($element) {
        this.$element = $element;
        this.$innerContainer = $(`.${INNER_CONTAINER_CLASS}`, this.$element);
        this.$items = $(`.${ITEM_CLASS}`, this.$innerContainer);
        this.itemPositions = [];
        this.$buttonBack = null;
        this.$buttonForward = null;

        this.init();
        this.registerListeners();
    }

    init() {
        this.initContainerHeight();
        this.initItemCheck();
        if (this.isInWideBreakpoints()) {
            this.addButtons();
            this.updateButtonStatus();
            this.setButtonWidths();
            this.initItemPositions();
        }
    }

    // the size of the outer container must be explicitly set in order to hide the scrollbar
    // of the wrapper. To get the correct height, we set overflow to hidden to remove any
    // potential scrollbars, then get the height and set it to the element before re-
    // enabling the scrollbars on the inner wrapper. This also enables us to use the
    // same mechanism on mobiles (i.e. iOS) where there's no scrollbars.
    initContainerHeight() {
        this.$innerContainer.css('overflow', 'hidden');
        let height = this.$innerContainer.outerHeight();
        this.$element.css('height', height);
        this.$innerContainer.css('overflow', '');
    }

    initItemCheck() {
        const markVisibleClass = this.$element.data('mark-visible-items');
        const markHiddenClass = this.$element.data('mark-hidden-items');

        if (markVisibleClass || markHiddenClass) {
            this.$innerContainer.on('scroll', FefDebounceHelper.debounce(() => this.markItems(markVisibleClass, markHiddenClass), DEBOUNCETIME));
        }
    }

    initItemPositions() {
        this.itemPositions = [];

        this.$items.each( (index, element) => {
            const left = $(element).position().left;
            const width = $(element).innerWidth();

            this.itemPositions.push({
                left: left,
                center: left + (width / 2),
                right: left + width
            });
        });
    }

    registerListeners() {
        $(window).on('resize', FefDebounceHelper.debounce(() => this.init(), DEBOUNCETIME));
        $(window).on('load', () => this.initContainerHeight());
    };

    addButtons() {
        // making sure to add the buttons only once
        if (this.$buttonBack === null) {
            this.$buttonBack = $(`<div class='${BACK_BUTTON_CLASS}'><span></span></div>`);
            this.$buttonForward = $(`<div class='${FORWARD_BUTTON_CLASS}'><span></span></div>`);

            // Apply tracking parameters if provided
            if (this.$element.data('tracking-forward')) {
                this.$buttonForward.attr('data-event-track', this.$element.data('tracking-forward'));
            }
            if (this.$element.data('tracking-back')) {
                this.$buttonBack.attr('data-event-track', this.$element.data('tracking-back'));
            }

            this.$element.append(this.$buttonBack, this.$buttonForward);

            // register listeners for buttons
            this.$innerContainer.on('scroll', FefDebounceHelper.debounce(() => this.updateButtonStatus(), DEBOUNCETIME));
            this.$buttonBack.on('click', () => { this.pageBack(); });
            this.$buttonForward.on('click', () => { this.pageForward(); });

            // hinting = showing a little bit of the remaining elements on hovering over the buttons.
            // Can be supplied in pixels via data-attribute, e.g. data-swipeable-hinting="20"
            const hintAmount = parseInt(this.$element.data('swipeable-hinting'));

            if (hintAmount > 0) {
                this.$buttonBack.hover(
                    this.hintOn(this.$buttonBack, hintAmount),
                    this.hintOff(this.$buttonBack)
                );
                this.$buttonForward.hover(
                    this.hintOn(this.$buttonForward, -hintAmount),
                    this.hintOff(this.$buttonForward)
                );
            }
        }
    }

    /**
     * Shows/hides the buttons via class if needed.
     * - Buttons only appear on Breakpoints Desktop and Desktop Wide
     * - If scrolled to the very end, don't show the forward button
     * - If scrolled to the very beginning, don't show the back button
     */
    updateButtonStatus() {
        // show forward/back buttons if needed
        if (this.hasScrollableOverflow() && this.isInWideBreakpoints()) {
            this.$buttonForward.toggleClass(BUTTON_ACTIVE_CLASS, !this.isAtScrollEnd());
            this.$buttonBack.toggleClass(BUTTON_ACTIVE_CLASS, !this.isAtScrollBeginning());
        }
    }

    hasScrollableOverflow() {
        return this.$innerContainer[0].scrollWidth > this.$innerContainer.innerWidth() + RIGHT_OFFSET;
    }

    isAtScrollEnd() {
        return this.$innerContainer.scrollLeft() + this.$innerContainer.innerWidth() >= this.$innerContainer[0].scrollWidth;
    }

    isAtScrollBeginning() {
        return this.$innerContainer.scrollLeft() <= BUTTON_BACK_THRESHOLD;
    }

    /**
     * Paging forward (-->):
     * Get the right-most item that's partially out of view (i.e. its right edge
     * is over the visible area's right edge).
     * Then get the one after that and try to center it. If there's no next one
     * we just take the last (the right-most) and use this.
     */
    pageForward() {
        let visibleAreaRightEdge = this.$innerContainer.scrollLeft() + this.$innerContainer.innerWidth(),
            nextItemIndex = this.itemPositions.findIndex(pos => pos.right > visibleAreaRightEdge);

        nextItemIndex = Math.min(nextItemIndex + 1, this.itemPositions.length - 1);

        let newPosition = this.itemPositions[nextItemIndex].center - (this.$innerContainer.innerWidth() / 2);

        this.scrollToPosition(newPosition);
    }

    /**
     * Paging back (<--):
     * Get the left-most item that's partially out of view (i.e. its right edge
     * is over the visible area's left edge).
     * Then get the one before that and try to center it. If there's no previous one
     * we just take the first (the left-most) and use this.
     */
    pageBack() {
        let visibleAreaLeftEdge = this.$innerContainer.scrollLeft(),
            nextItemIndex = this.itemPositions.findIndex(pos => pos.right > visibleAreaLeftEdge);

        nextItemIndex = Math.max(nextItemIndex - 1, 0);

        let newPosition = this.itemPositions[nextItemIndex].center - (this.$innerContainer.innerWidth() / 2);

        this.scrollToPosition(newPosition);
    }

    /**
     * Scrolls to a specified position in a specified (or default) time.
     * Also resets the hinting, if applicable, by removing the translation.
     *
     * @param {Number} position Where to scroll to
     * @param {Number} [time] How long it should take, optional
     */
    scrollToPosition(position, time) {
        time = typeof time === 'undefined' ? DEFAULT_SCROLL_TIME : time;

        this.checkFuturePosition(position);

        this.$innerContainer
            .stop(true, false)
            .animate( { scrollLeft: position }, time, 'easeInOutSine', () => {
                if (this.isInWideBreakpoints()) {
                    this.setButtonWidths();
                }
            });
    }

    checkFuturePosition(position) {
        // If the scroll position *will* be so that it's not possible to
        // scroll to one direction anymore, remove the hinting. We could
        // do this in the callback of animate, but if it happens
        // when starting the animation, it's less janky.
        if (this.isInWideBreakpoints()) {
            let willBeOutOfBoundsOnAnySide = false;

            if (position <= 0) {
                willBeOutOfBoundsOnAnySide = true;
                this.$buttonBack.removeClass(BUTTON_ACTIVE_CLASS);
            }

            if (position + this.$innerContainer.innerWidth() >= this.$innerContainer[0].scrollWidth) {
                willBeOutOfBoundsOnAnySide = true;
                this.$buttonForward.removeClass(BUTTON_ACTIVE_CLASS);
            }

            if (willBeOutOfBoundsOnAnySide) {
                this.applyHint(0);
            }
        }
    }

    setButtonWidths() {
        let visibleAreaRightEdge = this.$innerContainer.scrollLeft() + this.$innerContainer.innerWidth(),
            nextItemPos = this.itemPositions.find(pos => pos.right > visibleAreaRightEdge);

        if (nextItemPos) {
            this.setButtonWidth(this.$buttonForward, visibleAreaRightEdge - nextItemPos.left);
        }

        let visibleAreaLeftEdge = this.$innerContainer.scrollLeft(),
            prevItemPos = this.itemPositions.find(pos => pos.right > visibleAreaLeftEdge);

        if (prevItemPos) {
            this.setButtonWidth(this.$buttonBack, prevItemPos.right - visibleAreaLeftEdge);
        }
    }

    /**
     * Sets the width of a button after clamping the desired width.
     *
     * @param {JQuery.element} $button Button to set width of
     * @param {Number} width Desired width
     */
    setButtonWidth($button, width) {
        $button.width(Math.min(Math.max(Math.floor(width + 1), MIN_BUTTON_WIDTH), MAX_BUTTON_WIDTH));
    }

    /**
     * When hovering over a button (forward or backward), the container content
     * will be "hinted at", i.e. moved into view a bit more. How much is defined by
     * the user via data attribute and provided here. At the same time, the button
     * is made wider and given some padding as to not move the caret (< or >).
     *
     * The amount can be positive or negative. To always increase the width, we take
     * the absolute of the provided amount.
     * To not have to differentiate between forward and backward button, we set both
     * left and right padding. One of them is negative and thus not valid and will
     * not be applied without any check from our side. Very smart. The best.
     *
     * @param {JQuery.element} $button Which button is being hovered over
     * @param {Number} amount Amount of pixels to "hint"
     * @returns {Function}
     */
    hintOn($button, amount) {
        return () => {
            this.applyHint(amount);
            // save the previous width because it could have been changed
            $button.data('prev-width', $button.width()).css({
                'width': $button.width() + Math.abs(amount),
                'padding-left': -amount,
                'padding-right': amount
            });
        };
    }

    hintOff ($button) {
        return () => {
            this.applyHint(0);
            // restore the previously saved original width
            $button.css({
                'width': $button.data('prev-width'),
                'padding': ''
            });
        };
    }

    markItems(markVisibleClass, markHiddenClass) {
        this.$items.each( (_, element) => {
            const isInView = this.isItemCompletelyInView($(element));

            if (markVisibleClass) {
                $(element).toggleClass(markVisibleClass, isInView);
            }

            if (markHiddenClass) {
                $(element).toggleClass(markHiddenClass, !isInView);
            }
        });
    }

    isItemCompletelyInView($itemElem) {
        return !this.isOutOfBoundsLeft($itemElem) && !this.isOutOfBoundsRight($itemElem);
    }

    isOutOfBoundsLeft($itemElem) {
        return $itemElem.offset().left < this.$innerContainer.offset().left;
    }

    isOutOfBoundsRight($itemElem) {
        let rightEdgeItem = $itemElem.offset().left + $itemElem.outerWidth(),
            rightEdgeContainer = this.$innerContainer.offset().left + this.$innerContainer.outerWidth();

        return rightEdgeItem > rightEdgeContainer;
    }

    isInWideBreakpoints() {
        return FefResponsiveHelper.isDesktop() || FefResponsiveHelper.isDesktopWide();
    }

    applyHint(pixels) {
        this.$innerContainer.children().first().css('transform', `translateX(${pixels}px)`);
    }
}
