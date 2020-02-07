import {useState, useEffect} from 'react';
import debounce from 'lodash.debounce';

/**
 * Default ratio set to 16:9
 */
const DEFAULT_RATIO = 0.5625;

/**
 * The width and height of a container
 */
export interface RatioSizeProps {
  width: number | string;
  height: number | string;
}

/**
 * An object representing a responsive size alternative for a
 * given breakpoint.
 */
export interface ResponsiveBreakProps {
  breakpoint: number;
  ratioSize: RatioSizeProps;
}

/**
 * Optional optionsuration options for calculating the container size
 */
export interface RatioSizeOptionsProps {
  responsiveBreaks?: ResponsiveBreakProps[];
  ratio?: number;
}

/**
 * Ratio size props
 */
export interface UseRatioProps {
  initialState?: RatioSizeProps | null;
  options?: RatioSizeOptionsProps | null;
}

/**
 * Replaces the calculated container size with any passed in
 * responsive size overrides from options. Breakpoints are
 * applied mobile-first.
 * @param ratioSize
 * @param responsiveBreaks
 */
const setResponsive = ({
  ratioSize,
  responsiveBreaks,
}: {
  ratioSize: RatioSizeProps;
  responsiveBreaks?: ResponsiveBreakProps[];
}): RatioSizeProps => {
  if (!responsiveBreaks || typeof window === 'undefined') return ratioSize;
  let newRatioSize = ratioSize;

  // Shuffle responsive breakpoints from highest to lowest
  const sortedResponsiveBreaks = responsiveBreaks.sort((a, b) =>
    a.breakpoint > b.breakpoint ? -1 : 1,
  );

  for (const i in sortedResponsiveBreaks) {
    if (sortedResponsiveBreaks[i].breakpoint > window.innerWidth) {
      newRatioSize = sortedResponsiveBreaks[i].ratioSize;
    }
  }
  return newRatioSize;
};

/**
 * Calculates the size for the container based on a given (or default)
 * ratio and the current window viewport size
 * @param options optionsuration ratio size
 */
const calculateRatioSizes = (
  options: RatioSizeOptionsProps | null,
): RatioSizeProps => {
  if (typeof window === 'undefined') return {width: 0, height: 0};
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const ratio = options
    ? options.ratio
      ? options.ratio
      : DEFAULT_RATIO
    : DEFAULT_RATIO;
  if (windowHeight / windowWidth <= ratio) {
    return setResponsive({
      ratioSize: {
        width: windowWidth,
        height: Math.ceil(windowWidth * ratio),
      },
      responsiveBreaks: options ? options.responsiveBreaks : [],
    });
  } else {
    return setResponsive({
      ratioSize: {
        width: Math.ceil(windowHeight / ratio),
        height: windowHeight,
      },
      responsiveBreaks: options ? options.responsiveBreaks : [],
    });
  }
};

/**
 * Hook that calculates the width and height for a given ratio
 */
export default function useRatioSize(
  settings: UseRatioProps | void,
): [RatioSizeProps, () => void] {
  const baseInitialState = {width: 0, height: 0};
  const initialState =
    settings && settings.initialState
      ? settings.initialState
      : baseInitialState;
  const options = settings && settings.options ? settings.options : null;

  const [ratioSize, setRatioSize] = useState(() => {
    return initialState || calculateRatioSizes(null, options);
  });

  const updateRatioSize = (): void => {
    setRatioSize(calculateRatioSizes(options));
  };

  useEffect((): void | undefined | (() => void) => {
    if (typeof window === 'undefined') return;
    updateRatioSize();
    window.addEventListener('resize', debounce(updateRatioSize, 400));
    return (): void => {
      window.removeEventListener('resize', updateRatioSize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [ratioSize, updateRatioSize];
}
