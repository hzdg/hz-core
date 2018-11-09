# WindowsizeMonitor

#### To use

1. Install the component package
2. Import it in your module(use default import)
3. Use it as a wrapper around component where you need to use window's width&height
4. Component expects render-prop to be used

```
<WindowsizeMonitor>
    {({width, height}) => (
        <div style={{
            height: '500px',
            display: width > 1024 && height > 600 ? 'block' : 'none',
            background: width > 1024 && height > 600 ? 'red' : 'black',
        }} />
    )}
</WindowsizeMonitor>
```
