# JavaScript Development Guide

### Coding Standards

- Semicolons at the end of the line
- 4 spaces (no tabs)
- strict mode
- Don't use [jQuery event alias convenience methods](https://github.com/jquery/jquery/blob/master/src/event/alias.js) (such as `$(...).focus()`). Instead, use [`$(...).trigger(eventType, ...)`](http://api.jquery.com/trigger/) or [`$(...).on(eventType, ...)`](http://api.jquery.com/on/), depending on whether you're firing an event or listening for an event. (For example, use `$(...).trigger('focus')` or `$(...).on('focus', (event) => { /* handle focus event */ })`) We do this to be compatible with custom builds of jQuery where the event aliases module has been excluded.

### Checking coding style

- Validate and lint your code before committing to ensure your changes follow our coding standards

  ```shell
  gulp js-lint
  ```


### Creating components

- Try to write ES6 modules as general as possible (don't over-engineer)
- Before starting to code, make up your mind about the new component and discuss your solution with another team member
- You can use jQuery to access the dom (jQuery is a code dependency)
- Initialize components by passing the DOM-root element of the component in the constructor
- If possible, try to use  `js`-prefixed classes instead of style-related classes.
- Always develop components which can be used multiple times on the page without interference. This makes global DOM queries (e.g. `$(.my-component)`) usually a bad idea.   
- Components are supposed to initialize themselves on page load (Tooltips) or created on demand


### Naming

- Name your component JS file with a `fef-` prefix (`fef-tooltip.js`, `fef-search.js`, ...)
- Use CamelCase notation for class and variable names
- Names of classes start with a capital letter
- Constants should use only upper case characters (THIS_IS_A_CONSTANT)
- Always indicate a jQuery element with "$" in front of the variable name


### Events

- Your component may fire events which can trigger actions in other components in- or  outside of the frontend framework
- Always use `fef` as the prefix of your event name
- Event names are not camel case, concatenate your event description like this

  ```javascript
  const export USER_FELL_ASLEEP_EVENT = 'fef.button.of.my.component.clicked';
  ```

- Define events in `fef-events.js`, if they can be used outside of the current component
- Native events (e.g. `touchstart`, `keydown`, etc.) do not need to be documented
- Document in detail what your event is for and what it indicates
- Provide callback functions in your component if you want to interact with the outside world
- Do not limit components which possibly subscribe to an event (Avoid documentation like: *"When triggered, outside 
component A should do action B"*)
