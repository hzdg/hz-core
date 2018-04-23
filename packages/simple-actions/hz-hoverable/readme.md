A component that manages a focused state for the children.

```js
const cardComponent = ({getHoverableProps}) =>
    <div
        onMouseEnter={() => getHoverableProps.setHover(true)}
        onMouseLeave={() => getHoverableProps.setHover(false)}
        style={{
            backgroundColor: getHoverableProps.hovered ? 'blue' : 'purple',
            color: 'white',
            padding: 10,
            display: 'inline-block',
        }}
    >
        Hover Over Me
    </div>;

<Hoverable render={cardComponent} />
```
