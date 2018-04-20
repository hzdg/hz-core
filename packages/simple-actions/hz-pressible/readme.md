A component that manages a pressed state for the children.

```js

const myPressible = ({pressed, setPress}) =>
    <div
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        style={{
            backgroundColor: pressed ? 'pink' : 'gray',
            padding: 10,
            display: 'inline-block',
        }}
    >
        Press Me
    </div>;

<Pressible render={myPressible} />
```
