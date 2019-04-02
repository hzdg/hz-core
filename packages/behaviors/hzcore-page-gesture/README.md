---
name: PageGesture
menu: Headless Components
route: page-gesture
---

# PageGesture

A component that translates common pagination gestures
into 'next' and 'previous' events.

A vertical pagination example:

```js
const {Spring, animated} = require('react-spring');
const PAGE_SIZE = 500;
const MAX_PAGES = 10;

initialState = {index: 0};

<PageGesture
    preventDefault
    orientation={PageGesture.VERTICAL}
    onNext={() => {
        if (state.index < MAX_PAGES - 1) setState({index: state.index + 1});
    }}
    onPrevious={() => {
        if (state.index > 0) setState({index: state.index - 1});
    }}
    onFirst={() => setState({index: 0})}
    onLast={() => setState({index: MAX_PAGES - 1})}
>
    {({gestureRef, xDelta, yDelta, gesturing, action}) => (
        <div
            tabIndex={1}
            ref={gestureRef}
            style={{
                overflow: 'hidden',
                width: '100%',
                height: PAGE_SIZE,
            }}
        >
            <Spring
                native
                from={{y: 0}}
                to={{
                    y: gesturing
                        ? yDelta + state.index * -PAGE_SIZE
                        : state.index * -PAGE_SIZE,
                }}
            >
                {({y}) => (
                    <animated.div
                        style={{
                            height: '100%',
                            transform: y.interpolate(v => `translateY(${v}px)`),
                        }}
                    >
                        {Array.apply(
                            null,
                            Array(Math.min(MAX_PAGES, state.index + 2)),
                        ).map((_, i) => (
                            <Spring
                                key={i}
                                native
                                from={{
                                    backgroundColor: 'lightgray',
                                    color: 'gray',
                                }}
                                to={{
                                    backgroundColor:
                                        i === state.index
                                            ? 'blue'
                                            : 'lightgray',
                                    color:
                                        i === state.index
                                            ? 'lightblue'
                                            : 'gray',
                                }}
                            >
                                {({backgroundColor, color}) => (
                                    <animated.div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                            backgroundColor,
                                            color,
                                        }}
                                    >
                                        <h1
                                            style={{
                                                fontFamily: 'sans-serif',
                                                fontSize: '500px',
                                            }}
                                        >
                                            {i}
                                        </h1>
                                    </animated.div>
                                )}
                            </Spring>
                        ))}
                    </animated.div>
                )}
            </Spring>
        </div>
    )}
</PageGesture>;
```
