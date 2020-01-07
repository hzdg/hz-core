/** Optional options for creating a `MovingAverage`. */
export interface MovingAverageOptions {
  /**
   * How many previous values to include in the calculation of the average.
   * Once the number of values starts to exceed `size`, older values
   * are dropped from the calculation. This is what makes the average 'move'.
   *
   * Defaults to `10`.
   */
  size?: number;
  /**
   * How much weight to give to the latest value.
   * This weight regresses linearly over `size` number of values,
   * such that the latest value has the most weight, and the oldest
   * value the least.
   *
   * Use a negative value to give the oldest value the most weight instead.
   *
   * Use a falsy value to give all values equal weight.
   *
   * Defaults to `1`.
   */
  weight?: number;
  /**
   * Whether or not the moving average is rounded to the nearest integer.
   *
   * Defaults to `false`.
   */
  round?: boolean;
}

/**
 * Weigh the importance of the given `value` against
 * the `max` important value using the given `scale`.
 *
 * If `scale` is positive, values _further_ from `max` have more weight.
 *
 * If `scale` is negative, values  _closer_ to `max` have more weight.
 *
 * If `scale` is `0` (the default), all values have equal weight.
 */
function weigh(value: number, max: number, scale = 0): number {
  let weight = 1;
  if (scale > 0) {
    weight = ((max - value) / max) * scale;
  } else if (scale < 0) {
    weight = (value / max) * Math.abs(scale);
  }
  return weight;
}

/**
 * `MovingAverage` is a simple utility for keeping an average
 * of the latest fixed number of values over time.
 */
export default class MovingAverage {
  protected _size: number;
  protected _scale: number;
  protected _round: boolean;
  protected _store: number[];
  protected _pointer: number;
  protected _pins: number[];
  protected _delta: number;
  protected _average: number | null;

  constructor(options?: MovingAverageOptions) {
    this._size = options?.size ?? 10;
    this._scale = options?.weight ?? 1;
    this._round = options?.round ?? false;
    if (!this._size || !(this._size > 0)) {
      throw new Error('A positive size is required!');
    }
    this._store = new Array(this._size);
    this._pins = [];
    this._pointer = 0;
    this._delta = 0;
    this._average = null;
  }

  /** Add a value to the moving average. */
  push(v: number): void {
    this._pointer = (this._pointer + 1) % this._size;
    this._store[this._pointer] = v;
    this._average = null;
    this._delta += v;
  }

  /**
   * 'Pin' a value to the moving average.
   *
   * A pinned value will always be used in the average, meaning
   * the effective size of the moving average storage is increased by 1
   * for every pinned value.
   *
   * A pinned value will be weighed as though it were the oldest
   * value in the storage. If more than one value is pinned, then they
   * will be weighed in reverse order to when they were pinned.
   */
  pin(v: number): void {
    this._pins.push(v);
    this._average = null;
  }

  /** View the last added value. */
  peek(): number {
    return this._store[this._pointer] ?? NaN;
  }

  /**
   * Reset the moving average.
   * Use this when your value is tied to discrete start and end events,
   * like a gesture.
   */
  reset(): void {
    this._store = new Array(this._size);
    this._pins = [];
    this._pointer = 0;
    this._delta = 0;
    this._average = null;
  }

  /** The absolute deviation of the last value from the moving average. */
  get deviation(): number {
    return Math.abs(this.value - this.average);
  }

  /** The last value added to the moving average. */
  get value(): number {
    return this.peek();
  }

  /** The cumulative change (from 0) of the value since the last reset. */
  get delta(): number {
    return this._delta;
  }

  /**
   * The moving average of the value since the last reset.
   * This average is based on the last `size` number of values,
   * and may be optionally weighted and rounded.
   */
  get average(): number {
    if (this._average === null) {
      const totalSize = this._size + this._pins.length;
      let sum = 0;
      let sumWeight = 0;
      let i = 0;
      while (i < this._size) {
        const index = (this._pointer + i) % this._size;
        const value = this._store[index];
        if (value != null) {
          const weight = weigh(i, totalSize, this._scale);
          sumWeight += weight;
          sum += value * weight;
        }
        i += 1;
      }
      while (i < totalSize) {
        const index = i - this._size;
        const value = this._pins[index];
        if (value != null) {
          const weight = weigh(i, totalSize, this._scale);
          sumWeight += weight;
          sum += value * weight;
        }
        i += 1;
      }
      const average = sum / sumWeight;
      this._average = this._round ? Math.round(average) : average;
    }
    return this._average;
  }

  /**
   * The moving average of the value since the last reset.
   * This average is based on the last `size` number of values,
   * and may be optionally weighted and rounded.
   */
  valueOf(): number {
    return this.average;
  }
}
