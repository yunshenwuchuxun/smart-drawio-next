/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with flush method
 */
export function debounce(fn, delay) {
  let timeoutId = null;
  let pendingArgs = null;

  const debouncedFn = (...args) => {
    pendingArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...pendingArgs);
      timeoutId = null;
      pendingArgs = null;
    }, delay);
  };

  debouncedFn.flush = () => {
    if (timeoutId && pendingArgs) {
      clearTimeout(timeoutId);
      fn(...pendingArgs);
      timeoutId = null;
      pendingArgs = null;
    }
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      pendingArgs = null;
    }
  };

  return debouncedFn;
}
