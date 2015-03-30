'use strict';

export var Methods = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
  HEAD: 'HEAD'
}

export const ContentTypes = {
  'json': 'application/json',
  'form': 'application/x-www-form-urlencoded',
  'text': 'text/plain'
};

// Cross-browser XHR factories taken from http://www.quirksmode.org/js/xmlhttp.html
var XMLHttpFactories = [
  function () {return new XMLHttpRequest()},
  function () {return new ActiveXObject("Msxml2.XMLHTTP")},
  function () {return new ActiveXObject("Msxml3.XMLHTTP")},
  function () {return new ActiveXObject("Microsoft.XMLHTTP")}
];

export function buildXHR() {
  var xmlhttp = false;
  for (var i = 0; i < XMLHttpFactories.length; i++) {
    try {
      xmlhttp = XMLHttpFactories[i]();
    } catch (e) {
      continue;
    }
    break;
  }
  return xmlhttp;
}
