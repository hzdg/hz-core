import React, {
  forwardRef,
  useReducer,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import {ScaleLinear, ScaleOrdinal} from 'd3-scale';
import {ScaleSVG} from '@vx/responsive';
import {scaleLinear, scaleOrdinal} from '@vx/scale';
import {schemeTableau10} from 'd3-scale-chromatic';
import useRefCallback from '@hzcore/hook-ref-callback';
import useSize from '@hzcore/hook-size';
import {
  GestureState,
  GestureEndState,
  GestureHandler,
} from '@hzcore/gesture-catcher';
import TooltipArea, {TooltipContent} from './TooltipArea';
import EventAreas from './EventAreas';
import Legend from './Legend';

export interface Snapshot {
  eventType: string;
  timeStamp: number;
  delta: number;
  gesturing?: boolean;
}

export interface GestureVisualizerState {
  id: string;
  data: Snapshot[];
  initialTimeStamp: number;
  lastTimeStamp: number;
}

export interface GestureVisualizerProps {
  data: GestureVisualizerState | GestureVisualizerState[];
  onClick?: React.EventHandler<React.MouseEvent>;
  children?: React.ReactNode;
}

type TimeStampedObject =
  | GestureState
  | GestureEndState
  | WheelEvent
  | React.WheelEvent
  | MouseEvent
  | React.MouseEvent
  | TouchEvent
  | React.TouchEvent
  | KeyboardEvent
  | React.KeyboardEvent;

const INITIAL_TIME_SCALE = 100;
const PADDING_HORIZONTAL = 0.0;
const PADDING_VERTICAL = 0.1618;

const ADD_SNAPSHOT = 'ADD_SNAPSHOT';
const RESET = 'RESET';

interface AddSnapshotAction {
  type: typeof ADD_SNAPSHOT;
  payload: Snapshot;
}

interface ResetAction {
  type: typeof RESET;
  payload: string;
}

function timeExtent(
  series: GestureVisualizerState[],
  minDuration: number,
): [number, number] {
  const result = ([] as unknown) as [number, number];
  for (const {initialTimeStamp, lastTimeStamp} of series) {
    result[0] = Math.min(result[0] ?? initialTimeStamp, initialTimeStamp);
    result[1] = Math.max(result[1] ?? result[0] + minDuration, lastTimeStamp);
  }
  return result;
}

function useGestureSeries(
  data: GestureVisualizerState | GestureVisualizerState[],
): GestureVisualizerState[] {
  const [allSeries, setAllSeries] = useState(() =>
    Array.isArray(data) ? data : [data],
  );
  useEffect(
    () => {
      setAllSeries(Array.isArray(data) ? data : [data]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.isArray(data) ? data : [data],
  );
  return allSeries;
}

function useTimeStampScale(
  allSeries: GestureVisualizerState[],
  width: number,
): ScaleLinear<number, number> {
  const [start, end] = timeExtent(allSeries, INITIAL_TIME_SCALE);
  const [timeStampScale] = useState(() => scaleLinear<number>({clamp: true}));
  useMemo(() => {
    timeStampScale.range([
      Math.round(width * PADDING_HORIZONTAL),
      width - Math.round(width * PADDING_HORIZONTAL),
    ]);
    timeStampScale.domain([start, end]);
  }, [timeStampScale, width, start, end]);
  return timeStampScale;
}

function useDeltaScale(
  allSeries: GestureVisualizerState[],
  height: number,
  yFactor: ScaleLinear<number, number>,
): ScaleLinear<number, number> {
  const [deltaScale] = useState(() => scaleLinear<number>({clamp: true}));
  useMemo(() => {
    deltaScale.range([
      Math.round(height * PADDING_VERTICAL),
      height - Math.round(height * PADDING_VERTICAL),
    ]);
    deltaScale.domain([1, height * yFactor(allSeries.length - 1)]);
  }, [deltaScale, height, allSeries.length, yFactor]);
  return deltaScale;
}

function usePowerScale(
  allSeries: GestureVisualizerState[],
): ScaleLinear<number, number> {
  const [factor] = useState(() => scaleLinear<number>({clamp: true}));
  useMemo(() => {
    factor.range([allSeries.length, 1]);
    factor.domain([0, allSeries.length - 1]);
  }, [factor, allSeries.length]);
  return factor;
}

function useColorScale(
  allSeries: GestureVisualizerState[],
): ScaleOrdinal<string, string> {
  const [colorScale] = useState(() =>
    scaleOrdinal<string>({range: schemeTableau10}),
  );
  useMemo(() => {
    colorScale.domain(allSeries.map(({id}) => String(id)));
  }, [colorScale, allSeries]);
  return colorScale;
}

const getTimeStamp = (event: TimeStampedObject): number =>
  Math.round('timeStamp' in event ? event.timeStamp : event.time);

const getGesturing = (event: TimeStampedObject): boolean | undefined =>
  'gesturing' in event ? event.gesturing : undefined;

const absMax = (a: number, b: number): number =>
  Math.max(Math.abs(a), Math.abs(b));

const getDelta = (event: TimeStampedObject): number => {
  if ('deltaX' in event) return absMax(event.deltaX, event.deltaY);
  if ('movementX' in event) return absMax(event.movementX, event.movementY);
  if ('xVelocity' in event) return absMax(event.xVelocity, event.yVelocity);
  return 0;
};

const takeSnapshot = (event: TimeStampedObject): Snapshot => {
  return {
    eventType: event.type,
    gesturing: getGesturing(event),
    timeStamp: getTimeStamp(event),
    delta: getDelta(event),
  };
};

const reduceGestureVisualizerState = (
  state: GestureVisualizerState,
  action: AddSnapshotAction | ResetAction,
): GestureVisualizerState => {
  switch (action.type) {
    case RESET: {
      return {
        id: action.payload,
        data: [],
        initialTimeStamp: 0,
        lastTimeStamp: 1000,
      };
    }
    case ADD_SNAPSHOT: {
      if (!state.initialTimeStamp) {
        const initialTimeStamp = action.payload.timeStamp;
        return {
          ...state,
          data: [action.payload],
          initialTimeStamp,
          lastTimeStamp: initialTimeStamp,
        };
      } else {
        state.data.push(action.payload);
        return {
          ...state,
          lastTimeStamp: action.payload.timeStamp,
        };
      }
    }
  }
};

function useGestureData(
  id: string,
): [GestureVisualizerState, (event: TimeStampedObject) => void] {
  const [state, dispatch] = useReducer(
    reduceGestureVisualizerState,
    null,
    () => ({
      id,
      initialTimeStamp: 0,
      lastTimeStamp: 1000,
      data: [],
    }),
  );

  useEffect(() => {
    if (id != null) {
      dispatch({type: RESET, payload: id});
    }
  }, [id]);

  const handleEvent = useCallback((event: TimeStampedObject) => {
    dispatch({type: ADD_SNAPSHOT, payload: takeSnapshot(event)});
  }, []);

  return [state, handleEvent];
}

export function useGestureVisualizer(
  inputType: string,
): [GestureHandler, {data: GestureVisualizerState[]; onClick: () => void}] {
  const [id, setId] = useState(0);
  const onClick = useCallback(() => setId(v => v + 1), [setId]);
  const [eventData, eventHandler] = useGestureData(`${inputType}-${id}`);
  const [gestureData, gestureHandler] = useGestureData(`Gesture State-${id}`);
  const gestureHandlers = useMemo(
    () => ({
      onStart: gestureHandler,
      onMove: gestureHandler,
      onEnd: gestureHandler,
      __debug: eventHandler,
    }),
    [gestureHandler, eventHandler],
  );
  const data = useMemo(() => [eventData, gestureData], [
    eventData,
    gestureData,
  ]);
  return [gestureHandlers, {data, onClick}];
}

export default forwardRef(function GestureVisualizer(
  {data, children, ...props}: GestureVisualizerProps,
  forwardedRef: React.Ref<HTMLDivElement>,
): JSX.Element {
  const [ref, setRef] = useRefCallback(null, forwardedRef);
  const {width, height} = useSize(ref);
  const allSeries = useGestureSeries(data);
  const xScale = useTimeStampScale(allSeries, width);
  const yFactor = usePowerScale(allSeries);
  const yScale = useDeltaScale(allSeries, height, yFactor);
  const colorScale = useColorScale(allSeries);

  return (
    <div
      ref={setRef}
      style={{
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        border: '1px solid black',
        maxWidth: 'calc(100% - 2px)',
        minHeight: 160,
        height: 320,
      }}
      {...props}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
      <div style={{position: 'absolute'}}>
        <Legend colorScale={colorScale} />
      </div>
      <ScaleSVG width={width} height={height}>
        {allSeries.map((series, index) => (
          <EventAreas
            key={`series-${index}`}
            series={series}
            timeStampScale={xScale}
            deltaScale={yScale}
            fillColor={colorScale(String(series.id))}
            yFactor={yFactor(index)}
            height={height}
          />
        ))}
        <TooltipArea
          width={width}
          height={height}
          allSeries={allSeries}
          timeStampScale={xScale}
          deltaScale={yScale}
          colorScale={colorScale}
          yFactor={yFactor}
        />
      </ScaleSVG>
      <TooltipContent />
    </div>
  );
});
