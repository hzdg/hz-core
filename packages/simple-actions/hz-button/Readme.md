Simple button.

```js
<Button text="Press Me" />
```

### Styles
There are a few ways to add styles to this component

#### Adding Styles with CSS Stylesheet
File: [mystyles.css](../packages/hz-button/src/styles/mystyles.css)
```js
require('./src/styles/mystyles.css');

<Button text="Press Red" customClassName="RedButton" />
```

#### Adding Styles with Inline Styling
```js

const myInlineStyles = {
    buttonBase: {
        border: '3px solid blue',
    },
};

<Button text="Press Me" styles={myInlineStyles} />
```

#### Adding Styles with CSS Modules

```js
const myCssModulesStyles = require('./src/styles/mystyles.css');

<Button text="Press Me" cssModuleClassNames={myCssModulesStyles} />
```
