/**
 * FNV-1a hashing function from https://gist.github.com/vaiorabbit/5657561
 */
export function fnv32a(str) {
  var FNV1_32A_INIT = 0x811c9dc5;
  var hval = FNV1_32A_INIT;
  for (var i = 0; i < str.length; ++i) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  return '' + hval >>> 0;
}

/**
 * HashCode function. Collision prone.
 *
 * http://en.wikipedia.org/wiki/Java_hashCode%28%29
 * http://stackoverflow.com/a/7616484/1279815
 */
export function hashCode(str) {
  var hash = 0, i, chr, len;
  if (str.length == 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash < 0 ? '' + (0-hash) : '1' + hash;
}

/**
 * Combine the output of two hash functions to reduce the possibility of collisions.
 */
export function combinedHashFn(str) {
  return fnv32a(str) + hashCode(str);
}
