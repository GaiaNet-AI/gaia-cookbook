"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/decamelize";
exports.ids = ["vendor-chunks/decamelize"];
exports.modules = {

/***/ "(rsc)/./node_modules/decamelize/index.js":
/*!******************************************!*\
  !*** ./node_modules/decamelize/index.js ***!
  \******************************************/
/***/ ((module) => {

eval("\nmodule.exports = function (str, sep) {\n\tif (typeof str !== 'string') {\n\t\tthrow new TypeError('Expected a string');\n\t}\n\n\tsep = typeof sep === 'undefined' ? '_' : sep;\n\n\treturn str\n\t\t.replace(/([a-z\\d])([A-Z])/g, '$1' + sep + '$2')\n\t\t.replace(/([A-Z]+)([A-Z][a-z\\d]+)/g, '$1' + sep + '$2')\n\t\t.toLowerCase();\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZGVjYW1lbGl6ZS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jZHAtdGVzdC1hZ2VudC8uL25vZGVfbW9kdWxlcy9kZWNhbWVsaXplL2luZGV4LmpzP2VhYzQiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyLCBzZXApIHtcblx0aWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBzdHJpbmcnKTtcblx0fVxuXG5cdHNlcCA9IHR5cGVvZiBzZXAgPT09ICd1bmRlZmluZWQnID8gJ18nIDogc2VwO1xuXG5cdHJldHVybiBzdHJcblx0XHQucmVwbGFjZSgvKFthLXpcXGRdKShbQS1aXSkvZywgJyQxJyArIHNlcCArICckMicpXG5cdFx0LnJlcGxhY2UoLyhbQS1aXSspKFtBLVpdW2EtelxcZF0rKS9nLCAnJDEnICsgc2VwICsgJyQyJylcblx0XHQudG9Mb3dlckNhc2UoKTtcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/decamelize/index.js\n");

/***/ })

};
;