import { VTask } from './structs';

const stack: VTask[] = [];
const DEADLINE_THRESHOLD = 1000 / 60; // Minimum time buffer for 60 FPS
const promise = Promise.resolve();
let deadline = 0;
let queued = false;

/*
 * Runs a callback, unless the main thread is blocked and it defers and runs later
 */
export const schedule = (callback: VTask): void => {
  stack.push(callback);
  nextTick();
};

export const shouldYield = (): boolean =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (<any>navigator)?.scheduling?.isInputPending({ includeContinuous: true }) ||
  performance.now() >= deadline;

export const flush = (): void => {
  deadline = performance.now() + DEADLINE_THRESHOLD;
  while (!shouldYield()) {
    const task = stack.shift();
    if (task) task();
    else break;
  }
  queued = false;
  if (stack.length > 0) nextTick();
};

export const nextTick = (): void => {
  if (!queued) {
    // Promise-based solution is by far the fastest solution
    // when compared with MessageChannel (ok) and setTimeout (bad)
    promise.then(flush);
    queued = true;
  }
};
