Simple button.

```js
const renderButton = ({hover}) =>
  <div>{hover ? 'Press' : 'Hover'} me!</div>;

<Button>{renderButton}</Button>
```

### Styles
There are a few ways to add styles to this component

#### Adding Styles with CSS Stylesheet
File: [mystyles.css](../packages/hz-button/src/styles/mystyles.css)
```js
require('./src/styles/mystyles.css');

const renderButtonWithClassName = ({hover}) =>
  <div className="RedButton__base">
    {hover ? 'Press' : 'Hover'} me!
  </div>;

<Button>{renderButtonWithClassName}</Button>
```

#### Adding Styles with Inline Styling
```js
const renderButton = ({hover}) =>
  <div style={{border: '3px solid', borderColor: hover ? 'red' : 'blue'}}>
    {hover ? 'Press' : 'Hover'} me!
  </div>;

<Button>{renderButton}</Button>
```

#### Adding Styles with CSS Modules

```js
const myCssModulesStyles = require('./src/styles/mystyles.css');

const renderButtonWithCssModule = ({hover}) =>
  <div className={myCssModulesStyles.buttonBase}>
    {hover ? 'Press' : 'Hover'} me!
  </div>;

<Button>{renderButtonWithCssModule}</Button>
```
