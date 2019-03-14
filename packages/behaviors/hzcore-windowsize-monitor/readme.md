# WindowsizeMonitor

#### To use with a hook(requires react v. 16.8+)

1. Install the component package
2. Import it in your module as `import {useWindowSize} from '@hzcore/windowsize-monitor'
3. Use it!

```
function BoxWithHook() {
    const {width, height} = useWindowSize();
    return (
        <div style={{
            height: '500px',
            display: width > 1024 && height > 600 ? 'block' : 'none',
            background: width > 1024 && height > 600 ? 'red' : 'black',
        }} />
    )
}

```

#### To use with a render prop

1. Install the component package
2. Import it in your module(use default import)
3. Use it as a wrapper around component where you need to use window's width&height

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
