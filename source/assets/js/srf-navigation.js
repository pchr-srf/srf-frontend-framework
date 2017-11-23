import {FefStorage} from './classes/fef-storage';

const STORAGE_KEY = 'SRF.Navigations';
const KEYCODES = {
    'enter': 13
};

export function init() {
    $('.js-navigation').each((i, elem) => {
        new SrfNavigation(elem);
    });
}

export class SrfNavigation {
    constructor(element) {
        this.$element = $(element);
        this.$submenuWrapper = this.$element.find('.navigation--subnav-wrapper');
        this.$subMenuButton = this.$element.find('.js-expand-icon');
        this.$arrow = this.$element.find('.expand-icon');
        this.id = this.$element.attr('id');

        this.$a11yElem = this.$element.find('.js-navigation-subnav-a11y');

        this.registerListeners();

        let isOpenOnStart = this.checkAndSetupStorage();
        if (isOpenOnStart) {
            this.toggleMenu(true);
        } else {
            this.$submenuWrapper.hide();
        }
    }

    /**
     * Make sure a parameter is actually a function - return an empty function if it's not.
     *
     * @param param any
     * @return {function()}
     */
    checkFunctionParam(param) {
        return param && typeof param == 'function' ? param : () => {};
    }

    registerListeners() {
        this.$subMenuButton.on('click', event => this.onSubMenuButtonClicked(event) );
        this.$subMenuButton.on('keydown', event => this.onSubMenuKeyPressed(event) );
    }

    onSubMenuButtonClicked(e) {
        typeof e !== 'undefined' ? e.preventDefault() : null;

        let subMenuIsOpen = !this.$arrow.hasClass('expand-icon--open');

        this.toggleMenu(subMenuIsOpen);
    }

    onSubMenuKeyPressed(e) {
        if (e.keyCode === KEYCODES.enter) {
            let subMenuIsOpen = !this.$arrow.hasClass('expand-icon--open');

            this.onSubMenuButtonClicked(e);

            if( subMenuIsOpen) {
                this.$submenuWrapper.find('.navigation-link').first().focus();
            }

            return false;
        }
    }

    toggleMenu(subMenuIsOpen) {
        // FeF 2:12 - Thou shall not be able to tab over the submenu when it's closed!
        if (subMenuIsOpen) {
            this.$submenuWrapper.show();
        } else {
            this.$submenuWrapper.one('transitionend', () => {
                this.$submenuWrapper.hide();
            });
        }

        this.$arrow.toggleClass('expand-icon--open', subMenuIsOpen);
        this.$subMenuButton.attr('aria-expanded', subMenuIsOpen);
        this.$submenuWrapper.toggleClass('navigation--subnav-wrapper--open', subMenuIsOpen);

        this.$a11yElem.attr({
            'aria-hidden': !subMenuIsOpen,
            'role': subMenuIsOpen ? '' : 'presentation'
        });

        this.saveNavigationState(subMenuIsOpen);
    }

    /**
     * Checks if there's data saved in localStorage about this Navigation. If not, create it.
     * Returns the initial state of the navigation.
     *
     * @return {boolean}
     */
    checkAndSetupStorage() {
        if (!this.id) {
            return false;
        }

        let storedNavigationData = FefStorage.getItemJsonParsed(STORAGE_KEY);

        if (storedNavigationData[this.id]) {
            return storedNavigationData[this.id].open;
        } else {
            this.saveNavigationState(false);

            return false;
        }
    }

    /**
     * Save the current state of the navigation (open or closed) in localStorage.
     *
     * @param isOpen {boolean}
     * @return {*}
     */
    saveNavigationState(isOpen) {
        if (!this.id) {
            return false;
        }

        let storedNavigationData = FefStorage.getItemJsonParsed(STORAGE_KEY);

        storedNavigationData[this.id] = {
            open: isOpen
        };

        FefStorage.setItemJsonStringified(STORAGE_KEY, storedNavigationData);
    }
}
