import { setFocus } from '../components/fef-a11y';
import { FefStorage } from '../classes/fef-storage';
import { KEYCODES } from '../utils/fef-keycodes';
import { SET_SEARCH_INACTIVE_EVENT } from '../utils/fef-events';

export function init() {
    $('.js-search')
        .filter((_, element) => !$(element).data('search-initialized'))
        .each((_, element) => {
            new SrfSearch(element);

            // mark element, so that it won't be initialized again by this module
            $(element).data('search-initialized', true);
        });
}

const DEFAULT_MAX_SUGGESTIONS = 7;
const DEFAULT_MIN_SEARCH_LENGTH = 2;

const ACTIVE_CLASS = 'search--active';
const OUTSIDE_CLICK_LISTENER_NAME = 'mousedown.search-destroyer';
const LOCAL_STORAGE_KEY = 'srf:search:history';

export class SrfSearch {

    constructor(element, options) {
        this.$element = $(element);
        this.$inputField = this.$element.find('.js-search-input');
        this.$searchResults = this.$element.find('.js-search-results');
        this.$closeIcon = this.$element.find('.js-search-close');

        this.options = $.extend({}, {
            maxSuggestionCount: DEFAULT_MAX_SUGGESTIONS,
            minSearchLength: DEFAULT_MIN_SEARCH_LENGTH
        }, options);

        this.typeaheadUrl = this.$element.attr('data-typeahead-url');
        this.clickedSuggestionsEnabled = this.$element.data('suggestion-history');
        this.typeaheadData = null;
        this.suggestionUrl = '';
        this.currTimeout = null;

        // search field is hidden before document.ready (events firing before document.ready can get lost)
        this.$inputField.addClass('search__input--loaded');
        this.registerListeners();
    }

    registerListeners() {
        // e.g. in the search modal, the whole element will be focused -> set focus to inputfield
        this.$element.on('focus', (e) => {
            setTimeout(() => {
                this.$inputField.focus();
            }, 0);
        });

        this.$element.on('submit', (e) => {
            if (this.$inputField.val().trim() == '') {
                return false;
            }
        });

        this.$inputField.on('focus', (e) => {
            this.setSearchActive();

            if (this.clickedSuggestionsEnabled
                && FefStorage.isLocalStorageAvailable()
                && FefStorage.hasItem(LOCAL_STORAGE_KEY)
                && this.$inputField.val() === '') {
                const storedResults = FefStorage.getItemJsonParsed(LOCAL_STORAGE_KEY);
                this.renderResults(storedResults, '');
            }
        }).on('keyup', (e) => {
            this.onKeyUp(e);
        }).on('keydown', (e) => {
            this.onKeyDown(e);
        }).on('click', (e) => {
            e.stopPropagation();
        });

        this.$closeIcon.on('click', (e) => {
            e.preventDefault();
            this.setSearchInactive();
            this.clearInput();
        }).on('keydown', (e) => {
            this.onCloseIconKeyDown(e);
        });

        this.$searchResults.on('keydown', (e) => {
            this.onResultsKeyDown(e);
        });

        this.$element.on(SET_SEARCH_INACTIVE_EVENT, () => {
            this.setSearchInactive();
        });
    }

    onKeyUp(e) {
        switch (e.keyCode) {
            case KEYCODES.tab:
                break;
            case KEYCODES.escape:
                this.$inputField.blur();
                this.setSearchInactive();
                this.clearInput();
                break;
            default:
                let query = this.$inputField.val().toString().toLowerCase();
                this.lookup(query);
        }
    }

    onKeyDown(e) {
        switch (e.keyCode) {
            case KEYCODES.tab:
                if (e.shiftKey) {
                    // Shift-Tabbing out of the search component
                    this.setSearchInactive();
                    this.clearInputIfAllowed();
                }
                break;
            case KEYCODES.up:
                this.moveUpInMenu();
                e.preventDefault();
                break;
            case KEYCODES.down:
                this.moveDownInMenu();
                e.preventDefault();
                break;
            default:
                break;
        }
    }

    onCloseIconKeyDown(e) {
        switch (e.keyCode) {
            case KEYCODES.escape:
                this.setSearchInactive();
                this.clearInput();
                break;
            case KEYCODES.tab:
                if (this.$searchResults.children().length === 0) {
                    this.setSearchInactive();
                    this.clearInputIfAllowed();
                }
                break;
            default:
                break;
        }
    }

    onResultsKeyDown(e) {
        switch (e.keyCode) {
            case KEYCODES.escape:
                this.setSearchInactive();
                this.clearInputIfAllowed();
                break;
            case KEYCODES.tab:
                // tabbing away from the last result
                if ($(e.target).parents('li').is(':last-child') && !e.shiftKey) {
                    this.setSearchInactive();
                    this.clearInputIfAllowed();
                }
                break;
            case KEYCODES.up:
                this.moveUpInMenu();
                e.preventDefault();
                break;
            case KEYCODES.down:
                this.moveDownInMenu();
                e.preventDefault();
                break;
            default:
                break;
        }
    }

    setSearchActive() {
        if (this.$element.hasClass(ACTIVE_CLASS)) {
            return false;
        }

        this.$element.addClass(ACTIVE_CLASS);
        // Listen to clicks outside of the element --> deactivates this search component
        $(document).on(OUTSIDE_CLICK_LISTENER_NAME, (e) => {
            // Disable this search if the click was not a descendant of any .js-search or if it's a descendant of a different search component
            if (!$(e.target).parents('.js-search').length && $(e.target).parents('.js-search') !== this.$element) {
                this.setSearchInactive();
            }
        });

        if (this.typeaheadData === null) {
            $.getJSON(this.typeaheadUrl, (data) => {
                this.typeaheadData = data;

                if (this.clickedSuggestionsEnabled
                    && FefStorage.isLocalStorageAvailable
                    && FefStorage.hasItem(LOCAL_STORAGE_KEY)) {
                    let items = FefStorage.getItemJsonParsed(LOCAL_STORAGE_KEY);
                    items = items.filter((storedItem) => {
                        return this.typeaheadData.find((fetchedItem) => { return (fetchedItem.name === storedItem.name && fetchedItem.url === storedItem.url); });
                    });

                    FefStorage.setItemJsonStringified(LOCAL_STORAGE_KEY, items);
                }
            });
        }

        this.$closeIcon.show();
    }

    setSearchInactive() {
        this.hideResults();
        this.$element.removeClass(ACTIVE_CLASS);
        $(document).off(OUTSIDE_CLICK_LISTENER_NAME);
        this.$element.find('.search-result__alert').empty();
    }

    moveUpInMenu() {
        let $suggestions = this.$searchResults.find('.search-result__link'),
            $currentlyFocused = $('.search-result__link:focus'),
            currentIndex = $suggestions.index($currentlyFocused),
            nextIndex = currentIndex - 1;

        if ($suggestions.length === 0) {
            return;
        }

        if (nextIndex < 0) {
            nextIndex = $suggestions.length - 1;
        }

        setFocus($suggestions.eq(nextIndex));
    }

    moveDownInMenu() {
        let $suggestions = this.$searchResults.find('.search-result__link'),
            $currentlyFocused = $('.search-result__link:focus'),
            currentIndex = $suggestions.index($currentlyFocused),
            nextIndex = currentIndex + 1;

        if ($suggestions.length === 0) {
            return;
        }

        if (nextIndex >= $suggestions.length) {
            nextIndex = 0;
        }

        setFocus($suggestions.eq(nextIndex));
    }

    hideResults() {
        this.$inputField.attr('aria-expanded', false);
        this.suggestionUrl = '';
        this.$element.find('.search-result__alert').empty();

        /**
         *  setTimeout fixes a different behavior in ie 11, which causes not being able to leave the input field.
         */
        setTimeout(() => {
            this.$searchResults.hide().html('').removeClass ('search__results--showed-results');
        }, 0);

    }

    clearInput() {
        this.$inputField.val('');
        this.$closeIcon.hide();
        this.suggestionUrl = '';
    }

    clearInputIfAllowed() {
        // clear input if data-keep-keyword-on-blur was not set
        if (this.$inputField.data('keep-keyword-on-blur') === undefined) {
            this.clearInput();
        }
    }

    lookup(query) {
        let results = [];

        if (this.typeaheadData === null) {
            return true;
        }

        if (query.length < this.options.minSearchLength) {
            this.hideResults();
            return true;
        }

        this.typeaheadData.forEach((item) => {
            const matchIndexName = item.name.toString().toLowerCase().indexOf(query);
            const matchIndexKey  = item.keymatches.toString().toLowerCase().indexOf(query);
            let matchIndex = Math.max(matchIndexName, matchIndexKey);
            if (matchIndex >= 0) {
                results.push({
                    name: item.name,
                    url: item.url,
                    matchIndex: matchIndex
                });
            }
        });

        if (results.length > 0) {
            results = results.slice(0, this.options.maxSuggestionCount);
            this.renderResults(results, query);
        } else {
            this.hideResults();
        }
    }

    /**
     * Renders the received search results into the results list.
     * For the Screen-Reader's sake it'll be rendered twice, once with the found substring highlighted and once readable.
     *
     * If we're replacing previously shown search results, make sure they're not animated anymore.
     *
     * @param {Object} results
     * @param {String} query
     */
    renderResults(results, query) {
        let html = '';
        const wasAlreadyShowingResults = this.$searchResults.children('li').length > 0;
        const resultLength = results.length;

        this.$searchResults.html('');

        results.map((result, index) => {
            let highlightedResult = this.highlightQuery(query, result.name);
            const $li = $('<li>', { class: `typeahead-suggestion ${wasAlreadyShowingResults ? 'typeahead-suggestion--no-animation' : ''}`});
            const $link = $('<a>', { class: 'search-result__link', href: result.url, 'data-referrer-track' : 'srg_override_mod1=search_suggestions&srg_override_mod2=search_result&srg_override_mod3=' + query + '&srg_override_mod4=' + resultLength + '-' + (index + 1)});

            $link.on('click', () => {

                this.$inputField.val('');

                if (this.clickedSuggestionsEnabled && FefStorage.isLocalStorageAvailable()) {
                    let storedResults = [];
                    if (FefStorage.hasItem(LOCAL_STORAGE_KEY)) {
                        storedResults = FefStorage.getItemJsonParsed(LOCAL_STORAGE_KEY);
                    }

                    storedResults = storedResults.filter((item) => {
                        return (item.name !== result.name && item.url !== result.url);
                    });

                    storedResults.unshift(result);
                    storedResults = storedResults.slice(0, this.options.maxSuggestionCount);
                    FefStorage.setItemJsonStringified(LOCAL_STORAGE_KEY, storedResults);
                }

            });

            $('<span>', { role: 'presentation', 'aria-hidden': true }).append(highlightedResult).appendTo($link);
            $('<span>', { class: 'h-offscreen' }).text(result.name).appendTo($link);

            $li.append($link);
            $li.appendTo(this.$searchResults);
        });

        this.$searchResults.show();

        // additional screenreader info (same behavior like meteo search field)
        let $result_alert = $('.search-result__alert');
        let result_html = `${results.length} ${this.$inputField.data('result-alert-text')} <span>${query}</span>`;

        if ($result_alert.length === 0) {
            this.$searchResults.before(`<span class="h-offscreen search-result__alert" role="alert">${result_html}</span>`);
        } else {
            $result_alert.html(result_html);
        }

        this.$inputField.attr('aria-expanded', true);
    }

    /**
     * Replaces the query string in a search result with the same string in bold  e.g.
     * "Tag" in "Tagesschau" after searching for "Tag"
     *
     * @param {String} query
     * @param {String} name
     * @returns {String}
     */
    highlightQuery(query, name) {
        query = query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
        return name.replace(new RegExp('(' + query + ')', 'ig'), ($1, match) => `<strong>${match}</strong>`);
    }
}
