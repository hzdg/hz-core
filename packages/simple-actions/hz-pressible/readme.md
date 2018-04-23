A component that manages a pressed state for the children.

```js

const myPressible = ({getPressibleProps}) =>
    <div
        onMouseDown={() => getPressibleProps.setPress(true)}
        onMouseUp={() => getPressibleProps.setPress(false)}
        style={{
            backgroundColor: getPressibleProps.pressed ? 'pink' : 'gray',
            padding: 10,
            display: 'inline-block',
        }}
    >
        Press Me
    </div>;

<Pressible render={myPressible} />
```
