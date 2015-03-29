'use strict';

var Utils = '../core/Utils';

const SectionTypes = {
  LOCAL: 'LOCAL',
  STRING: 'STRING'
};

var URLBuilder = {
  /**
   * Given URL options of the following format, construct a URL.
   *
   * @param {Object} options - The URL options object.
   * @param {string} options.template - The structure of the URL path with tokens that can be
   *     replaced with locals. The URL template should not be URL encoded since that will be
   *     handled by the URLBuilder.
   * @param {string} [options.protocol] - The protocol of the URL. Usually 'http' or 'https'.
   * @param {string} [options.host] - The host name of the URL. E.g. "www.example.com".
   * @param {string} [options.origin] - The origin is the combination of a protocol and host.
   *     This can be used as a shorthand to specify "https://www.example.com" instead of using
   *     the `protocol` and `host` options separately.
   * @param {Object} [options.search] - The set of URL query parameters to be appended to the
   *     URL like "?key1=val1&key2=val2". All values are automatically URL encoded.
   * @param {string} [options.hash] - The URL hash fragment to be appended to the URL like
   *     "#myHashFragment".
   * @param {Object} [options.locals] - The set of keys/values available for variable
   *     substitution. The value is automatically URL encoded and then takes the place of the
   *     corresponding local, which takes either of these forms: {key} or {/key}. If the "key"
   *     local is defined, then {/key} expands to "/keyValue", otherwise it expands to an
   *     empty string without the leading slash.
   */
  build: (options) {
    var protocol = options.protocol ? options.protocol + '://' : '';
    var searchQueryParams = Utils.map(
      options.search,
      (val, key) => 'key=' + encodeURIComponent(val)
    );

    return [
      // Protocol and host.
      options.origin || [protocol, host].join(''),

      // Compute path using template and locals.
      Utils.map(
        splitIntoSections(options.template),
        section => transformSection(section, options)
      ).join(''),

      // Search query parameters
      searchQueryParams.length > 0 ? '?' + searchQueryParams.join('&') : '',

      // Hash fragment
      options.hash ? '#' + options.hash : ''
    ].join('');
  }
};

function splitIntoSections(template) {
  var sections = [], startIndex = null, isToken = null;
  for (var i = 0; i < template.length; i++) {
    let char = template[i],
        section = null;

    if (isToken && char === '}') {
      let str = template.slice(startIndex, i),
          slash = str[0] === '/';
      section = {type: SectionTypes.LOCAL, val: str.slice(slash ? 1 : 0), slash: slash};
    } else if (isToken === false && char === '{') {
      section = {type: SectionTypes.STRING, val: template.slice(startIndex, i)};
    }

    if (section) {
      sections.push(section);
      isToken = startIndex = null;
    }

    if (startIndex === null) {
      startIndex = i;
      isToken = char === '{';
    }
  }
}

function transformSection(section, options) {
  if (section.type === SectionTypes.LOCAL) {
    return (section.slash ? '/' : '') + encodeURIComponent(options.locals[section.val]);
  } else if (section.type === SectionTypes.STRING) {
    return encodeURIComponent(section.val);
  } else {
    throw 'Missing or unrecognized section type';
  }
}

module.exports = URLBuilder;
