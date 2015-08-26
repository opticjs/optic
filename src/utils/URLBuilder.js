'use strict';

import * as Utils from '../core/Utils';

const SectionTypes = {
  LOCAL: 'LOCAL',
  STRING: 'STRING'
};

export default {
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
  build(options) {
    var protocol = options.protocol ? options.protocol + '://' : '';
    var host = options.host || '';
    var searchQueryParams = Utils.map(
      Object.keys(options.search),
      key => `${key}=${encodeURIComponent(options.search[key])}`
    );

    var a = [
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
    console.log(a);
    return a;
  }
};

// TODO(lopatin) This method is so terrible and wrong.
function splitIntoSections(template) {
  return template.split('/').map((section, i) => ({
    type: SectionTypes.STRING,
    val: section,
    slash: !!i
  }));
  // var sections = [], startIndex = null, isToken = null;
  // for (var i = 0; i < template.length; i++) {
  //   let char = template[i],
  //       section = null;


  //   if (isToken && char === '}') {
  //     let str = template.slice(startIndex, i),
  //         slash = str[0] === '/';
  //     section = {type: SectionTypes.LOCAL, val: str.slice(slash ? 1 : 0), slash: slash};
  //   } else if (!isToken && char === '{') {
  //     section = {type: SectionTypes.STRING, val: template.slice(startIndex, i)};
  //   } else if (!isToken && char === '/') {
  //     section = {type: SectionTypes.STRING, val: template.slice(startIndex + 1, i), slash: true};
  //   } else if (i + 1 === template.length) {
  //     section = {type: SectionTypes.STRING, val: template.slice(startIndex + 1, i + 1)};
  //   }

  //   if (section) {
  //     sections.push(section);
  //     isToken = startIndex = null;
  //   }

  //   if (startIndex === null) {
  //     startIndex = i;
  //     isToken = char === '{';
  //   }
  // }

  // console.log(sections);

  // return sections;
}

function transformSection(section, options) {
  if (section.type === SectionTypes.LOCAL) {
    return (section.slash ? '/' : '') + encodeURIComponent(options.locals[section.val]);
  } else if (section.type === SectionTypes.STRING) {
    return (section.slash ? '/' : '') + encodeURIComponent(section.val);
  } else {
    throw 'Missing or unrecognized section type';
  }
}
