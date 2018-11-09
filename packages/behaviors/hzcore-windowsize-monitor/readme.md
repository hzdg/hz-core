# WindowSizeMonitor

#### To use

1. Install the component package
2. Import it in your module(use default import)
3. Use it as a wrapper around component where you need to use window's width&height
4. Component expects render-prop to be used

```
<WindowSizeMonitor>
    {({width, height}) => (
        <div style={{display: width > 1024 && height > 600px ? 'block' : 'none'}} />
    )}
</WindowSizeMonitor>
```
