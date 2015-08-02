export function log(message) {
  console.log(message);
}

export function warn(message) {
  console.warn && console.warn(message) || console.log('WARNING: ' + message);
}
