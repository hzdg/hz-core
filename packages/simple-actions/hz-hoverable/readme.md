A component that manages a focused state for the children.

```js
const cardComponent = ({hovered, setHover}) =>
    <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
            backgroundColor: hovered ? 'blue' : 'purple',
            color: 'white',
            padding: 10,
            display: 'inline-block',
        }}
    >
        Hover Over Me
    </div>;

<Hoverable render={cardComponent} />
```
