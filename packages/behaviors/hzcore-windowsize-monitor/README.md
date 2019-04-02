---
name: WindowsizeMonitor
menu: Headless Components
route: windowsize-monitor
---

# WindowsizeMonitor

The component is used to determine the size(width & height) of the window. Some
use cases may include transforming the desktop nav to mobile navigation, or
to create a conditional rendering of components in the section depending on the
viewport size. It subsribes to a resize event and caches the events for optimization
purposes when using this hook/render prop in multiple components on the page.

#### To use with a hook(requires react v. 16.8+)

1. Install the component package
2. Import it in your module as `import {useWindowSize} from '@hzcore/windowsize-monitor'
3. Use it!

```jsx
function BoxWithHook() {
    const {width, height} = useWindowSize();
    return (
        <div
            style={{
                height: '500px',
                display: width > 1024 && height > 600 ? 'block' : 'none',
                background: width > 1024 && height > 600 ? 'red' : 'black',
            }}
        />
    );
}
```

#### To use with a render prop

1. Install the component package
2. Import it in your module. Use default import as `import WindowsizeMonitor from '@hzcore/windowsize-monitor'`
3. Use it as a wrapper around component where you need to use window's width&height

```jsx
<WindowsizeMonitor>
    {({width, height}) => (
        <div
            style={{
                height: '500px',
                display: width > 1024 && height > 600 ? 'block' : 'none',
                background: width > 1024 && height > 600 ? 'red' : 'black',
            }}
        />
    )}
</WindowsizeMonitor>
```
