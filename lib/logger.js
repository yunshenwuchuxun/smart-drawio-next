const isDev = process.env.NODE_ENV !== 'production';

/**
 * Log debug info only in development
 * @param {string} label
 * @param {any} data
 */
export function debug(label, data) {
  if (isDev) {
    console.log(label, data);
  }
}

/**
 * Log errors (always)
 * @param {string} label
 * @param {Error} error
 */
export function error(label, error) {
  console.error(label, error?.message || error);
}

/**
 * Mask sensitive string for logging
 * @param {string} value
 * @returns {string}
 */
export function mask(value) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= 8) return '***';
  return value.slice(0, 4) + '***' + value.slice(-4);
}
