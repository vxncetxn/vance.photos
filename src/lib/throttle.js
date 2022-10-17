export function throttle(callback, offset) {
  let baseTime = 0;
  return (...args) => {
    const currentTime = Date.now();
    if (baseTime + offset <= currentTime) {
      baseTime = currentTime;
      callback(...args);
    }
  };
}
