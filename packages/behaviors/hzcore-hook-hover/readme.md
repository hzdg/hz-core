# hook-hover

The hook component to get the hover/focus event props for a component.
Use it any time you need to apply hover state to any functional component.
Returns a boolean to determine whether the element is being hovered and an
object with 2 event props:

```
  onMouseEnter
  onMouseLeave
```

#### To use (requires react v. 16.8+)

```js
import useHover from '@hzcore/hook-hover';

function Box() {
    const [isHovering, hoverProps] = useHover({
        mouseEnterDelayMS: 50,
        mouseLeaveDelayMS: 50,
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
