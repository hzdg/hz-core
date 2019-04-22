import {useState, useEffect, useRef} from 'react';

interface UsePressReturn {
  isPressed: boolean;
  pressCount: number;
  pressProps: {
    onMouseDown: () => void;
    onMouseUp: () => void;
  };
  pressibleEl: React.MutableRefObject<JSX.Element | null>;
}

const usePress = (props: {
  defaultCount: number;
  handler: (args: {isPressed: boolean; pressCount: number}) => void | null;
}): UsePressReturn => {
  const {defaultCount, handler} = props;
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(defaultCount);
  const pressibleEl = useRef(null);

  const pressProps = {
    ref: pressibleEl,
    onMouseDown: () => {
      if (!isPressed) {
        setIsPressed(true);
        setPressCount(pressCount + 1);
      }
    },
    onMouseUp: () => {
      if (isPressed) {
        setIsPressed(false);
      }
    },
  };

  useEffect(() => {
    if (handler && isPressed) {
      handler.call(pressibleEl, {isPressed, pressCount});
    }
  }, [isPressed, pressCount]);

  return {isPressed, pressCount, pressProps, pressibleEl};
};

usePress.defaultProps = {
  defaultCount: 0,
  handler: null,
};

export default usePress;
