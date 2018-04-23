A component that manages an on and off switch for its children.

_TODO: The below examples will need to be broken into separate components for reuse._

Simple off and on button
```js
const switchStyles = {
    cursor: 'pointer',
    padding: '10px',
    display: 'inline-block',
    color: 'white',
    textTransform: 'uppercase',
    fontFamily: 'arial',
    width: 40,
    textAlign: 'center',
    borderRadius: 5,
};

const mySwitch = ({getSwitchProps}) =>
    <div
        onMouseEnter={() => getSwitchProps.setHover(true)}
        onMouseLeave={() => getSwitchProps.setHover(false)}
        onMouseDown={() => {
            getSwitchProps.setToggleSwitch();
            getSwitchProps.setPress(true);
        }}
        onMouseUp={() => getSwitchProps.setPress(false)}
        style={{
            ...switchStyles,
            backgroundColor: getSwitchProps.on ? '#00ab00' : '#ec4444',
            border: getSwitchProps.hovered ? '3px solid rgba(0, 0, 0, 0.5)' : '3px solid rgba(0, 0, 0, 0.2)',
            boxShadow: getSwitchProps.pressed ? 'rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px' : 'rgba(0, 0, 0, 0.3) 0px 2px 6px, rgba(0, 0, 0, 0.3) 0px 1px 4px',
        }}
    >
        {getSwitchProps.on ? 'On' : 'Off'}
    </div>;

<Switch render={mySwitch} />
```

Toggle Switch example with a lever
```js
const trackStyles = {
    cursor: 'pointer',
    display: 'inline-block',
    color: 'white',
    textTransform: 'uppercase',
    fontFamily: 'arial',
    width: 100,
    height: 48,
    textAlign: 'center',
    borderRadius: 50,
    position: 'relative',
    padding: 5,
    transition: 'background-color 0.2s ease',
};

const leverStyles = {
    position: 'relative',
    height: '100%',
    width: '50%',
    top: 0,
    borderRadius: 50,
    transition: 'transform 0.3s ease, background-color 0.2s ease',
    boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px, rgba(0, 0, 0, 0.1) -2px -3px 5px inset',
};

const textStyles = {
    position: 'absolute',
    left: 0,
    top: 0,
    lineHeight: '48px',
    textAlign: 'center',
    display: 'block',
    width: '100%',
    fontSize: 20,
    fontWeight: 700,
    fontFamily: 'Courier',
}

const mySwitch = ({getSwitchProps}) =>
    <div
        onMouseEnter={() => getSwitchProps.setHover(true)}
        onMouseLeave={() => getSwitchProps.setHover(false)}
        onMouseDown={() => {
            getSwitchProps.setToggleSwitch();
            getSwitchProps.setPress(true);
        }}
        onMouseUp={() => getSwitchProps.setPress(false)}
        style={{
            ...trackStyles,
            backgroundColor: getSwitchProps.on ? '#75dc75' : 'gray',
        }}
    >
        <div
            style={{
                ...leverStyles,
                backgroundColor: getSwitchProps.on ? '#00ab00' : '#333333',
                transform: getSwitchProps.on ? 'translateX(100%)' : 'translateX(0)',
            }}
        >
            <span style={textStyles}>{getSwitchProps.on ? '1' : '0'}</span>
        </div>
    </div>;

<Switch render={mySwitch} />
```

Switch as an input field
```js

const checkboxWrapper = {
    position: 'relative',
    display: 'inline-block',
}
const shadowCheckbox = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    margin: 0,
    cursor: 'pointer',
    zIndex: 2,
};

const checkbox = {
    cursor: 'pointer',
    padding: '3px 4px',
    width: '15px',
    display: 'inline-block',
    color: 'white',
    textTransform: 'uppercase',
    fontFamily: 'arial',
    textAlign: 'center',
    WebkitAppearance: 'none',
    transition: 'all 0.3s ease',
    border: '2px solid rgba(0, 0, 0, 0.5)',
    borderRadius: 2,
};

const mySwitch = ({getSwitchProps}) =>
    <div
        style={checkboxWrapper}
    >
        <input
            type="checkbox"
            onMouseEnter={() => getSwitchProps.setHover(true)}
            onMouseLeave={() => getSwitchProps.setHover(false)}
            onMouseDown={() => {
                getSwitchProps.setToggleSwitch();
                getSwitchProps.setPress(true);
            }}
            onMouseUp={() => getSwitchProps.setPress(false)}
            checked={getSwitchProps.on}
            style={shadowCheckbox}
        />
        <div
            style={{
                ...checkbox,
                backgroundColor: getSwitchProps.on ? 'green' : 'gray',
                transform: getSwitchProps.pressed ? 'scale(0.9)' : 'scale(1)',
                boxShadow: getSwitchProps.hovered ? 'inset rgba(0, 0, 0, 0.6) 0px 0px 10px 1px' : '',
            }}
        >
            <span>{getSwitchProps.on ? '✔' : '✕'}</span>
        </div>
        <span style={{paddingLeft: '10px', fontFamily: 'arial'}}>Sign Me Up!</span>
    </div>;

<Switch render={mySwitch} />
```
