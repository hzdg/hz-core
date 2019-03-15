# useHover

The hook component to get the hover/focus event props for a component.
Use it any time you need to apply hover state or a focusable state.
Returns a boolean to determine whether the element is being hovered and
2(optionally 4 event props, if `focusable` argument is passed to the function):

```
  onMouseEnter
  onMouseLeave
  onBlur // optional
  onFocus // optional
```

#### To use (requires react v. 16.8+)

```js
function Box() {
    const [isHovering, hoverProps] = useHover({
        mouseEnterDelayMS: 50,
        mouseLeaveDelayMS: 50,
        focusable: true,
    });
    return (
        <div
            style={{
                background: isHovering ? 'black' : 'red',
                width: '200px',
                height: '200px',
            }}
            {...hoverProps}
        />
    );
}
```
