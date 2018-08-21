GestureCatcher
==============

A component that can detect gestures from mouse, touch, or keyboard inputs.
This is useful for custom UI like carousels, screen navigations,
or custom scrolling.

> **Note**: If your use case is related to scrolling,
> but doesn't need to control scroll position,
> then [ScrollMonitor](/#!/ScrollMonitor) provides a simpler approach.

A basic example that shows off all possible gesture inputs
(try using mouse, wheel/touchpad, touch, keyboard):

```js
<GestureCatcher preventDefault>
  {({gestureRef, ...props}) => (
    <div tabIndex={1} ref={gestureRef}>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  )}
</GestureCatcher>
```
