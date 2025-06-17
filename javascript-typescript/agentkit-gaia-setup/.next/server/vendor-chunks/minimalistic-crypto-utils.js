"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/minimalistic-crypto-utils";
exports.ids = ["vendor-chunks/minimalistic-crypto-utils"];
exports.modules = {

/***/ "(rsc)/./node_modules/minimalistic-crypto-utils/lib/utils.js":
/*!*************************************************************!*\
  !*** ./node_modules/minimalistic-crypto-utils/lib/utils.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\n\nvar utils = exports;\n\nfunction toArray(msg, enc) {\n  if (Array.isArray(msg))\n    return msg.slice();\n  if (!msg)\n    return [];\n  var res = [];\n  if (typeof msg !== 'string') {\n    for (var i = 0; i < msg.length; i++)\n      res[i] = msg[i] | 0;\n    return res;\n  }\n  if (enc === 'hex') {\n    msg = msg.replace(/[^a-z0-9]+/ig, '');\n    if (msg.length % 2 !== 0)\n      msg = '0' + msg;\n    for (var i = 0; i < msg.length; i += 2)\n      res.push(parseInt(msg[i] + msg[i + 1], 16));\n  } else {\n    for (var i = 0; i < msg.length; i++) {\n      var c = msg.charCodeAt(i);\n      var hi = c >> 8;\n      var lo = c & 0xff;\n      if (hi)\n        res.push(hi, lo);\n      else\n        res.push(lo);\n    }\n  }\n  return res;\n}\nutils.toArray = toArray;\n\nfunction zero2(word) {\n  if (word.length === 1)\n    return '0' + word;\n  else\n    return word;\n}\nutils.zero2 = zero2;\n\nfunction toHex(msg) {\n  var res = '';\n  for (var i = 0; i < msg.length; i++)\n    res += zero2(msg[i].toString(16));\n  return res;\n}\nutils.toHex = toHex;\n\nutils.encode = function encode(arr, enc) {\n  if (enc === 'hex')\n    return toHex(arr);\n  else\n    return arr;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbWluaW1hbGlzdGljLWNyeXB0by11dGlscy9saWIvdXRpbHMuanMiLCJtYXBwaW5ncyI6IkFBQWE7O0FBRWI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsZ0JBQWdCO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGdCQUFnQjtBQUNwQztBQUNBLElBQUk7QUFDSixvQkFBb0IsZ0JBQWdCO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esa0JBQWtCLGdCQUFnQjtBQUNsQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jZHAtdGVzdC1hZ2VudC8uL25vZGVfbW9kdWxlcy9taW5pbWFsaXN0aWMtY3J5cHRvLXV0aWxzL2xpYi91dGlscy5qcz9kMTdmIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gZXhwb3J0cztcblxuZnVuY3Rpb24gdG9BcnJheShtc2csIGVuYykge1xuICBpZiAoQXJyYXkuaXNBcnJheShtc2cpKVxuICAgIHJldHVybiBtc2cuc2xpY2UoKTtcbiAgaWYgKCFtc2cpXG4gICAgcmV0dXJuIFtdO1xuICB2YXIgcmVzID0gW107XG4gIGlmICh0eXBlb2YgbXNnICE9PSAnc3RyaW5nJykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXNnLmxlbmd0aDsgaSsrKVxuICAgICAgcmVzW2ldID0gbXNnW2ldIHwgMDtcbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIGlmIChlbmMgPT09ICdoZXgnKSB7XG4gICAgbXNnID0gbXNnLnJlcGxhY2UoL1teYS16MC05XSsvaWcsICcnKTtcbiAgICBpZiAobXNnLmxlbmd0aCAlIDIgIT09IDApXG4gICAgICBtc2cgPSAnMCcgKyBtc2c7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtc2cubGVuZ3RoOyBpICs9IDIpXG4gICAgICByZXMucHVzaChwYXJzZUludChtc2dbaV0gKyBtc2dbaSArIDFdLCAxNikpO1xuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXNnLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IG1zZy5jaGFyQ29kZUF0KGkpO1xuICAgICAgdmFyIGhpID0gYyA+PiA4O1xuICAgICAgdmFyIGxvID0gYyAmIDB4ZmY7XG4gICAgICBpZiAoaGkpXG4gICAgICAgIHJlcy5wdXNoKGhpLCBsbyk7XG4gICAgICBlbHNlXG4gICAgICAgIHJlcy5wdXNoKGxvKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cbnV0aWxzLnRvQXJyYXkgPSB0b0FycmF5O1xuXG5mdW5jdGlvbiB6ZXJvMih3b3JkKSB7XG4gIGlmICh3b3JkLmxlbmd0aCA9PT0gMSlcbiAgICByZXR1cm4gJzAnICsgd29yZDtcbiAgZWxzZVxuICAgIHJldHVybiB3b3JkO1xufVxudXRpbHMuemVybzIgPSB6ZXJvMjtcblxuZnVuY3Rpb24gdG9IZXgobXNnKSB7XG4gIHZhciByZXMgPSAnJztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtc2cubGVuZ3RoOyBpKyspXG4gICAgcmVzICs9IHplcm8yKG1zZ1tpXS50b1N0cmluZygxNikpO1xuICByZXR1cm4gcmVzO1xufVxudXRpbHMudG9IZXggPSB0b0hleDtcblxudXRpbHMuZW5jb2RlID0gZnVuY3Rpb24gZW5jb2RlKGFyciwgZW5jKSB7XG4gIGlmIChlbmMgPT09ICdoZXgnKVxuICAgIHJldHVybiB0b0hleChhcnIpO1xuICBlbHNlXG4gICAgcmV0dXJuIGFycjtcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/minimalistic-crypto-utils/lib/utils.js\n");

/***/ })

};
;