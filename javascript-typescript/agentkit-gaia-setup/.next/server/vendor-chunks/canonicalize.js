"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/canonicalize";
exports.ids = ["vendor-chunks/canonicalize"];
exports.modules = {

/***/ "(rsc)/./node_modules/canonicalize/lib/canonicalize.js":
/*!*******************************************************!*\
  !*** ./node_modules/canonicalize/lib/canonicalize.js ***!
  \*******************************************************/
/***/ ((module) => {

eval("/* jshint esversion: 6 */\n/* jslint node: true */\n\n\nmodule.exports = function serialize (object) {\n  if (typeof object === 'number' && isNaN(object)) {\n    throw new Error('NaN is not allowed');\n  }\n\n  if (typeof object === 'number' && !isFinite(object)) {\n    throw new Error('Infinity is not allowed');\n  }\n\n  if (object === null || typeof object !== 'object') {\n    return JSON.stringify(object);\n  }\n\n  if (object.toJSON instanceof Function) {\n    return serialize(object.toJSON());\n  }\n\n  if (Array.isArray(object)) {\n    const values = object.reduce((t, cv, ci) => {\n      const comma = ci === 0 ? '' : ',';\n      const value = cv === undefined || typeof cv === 'symbol' ? null : cv;\n      return `${t}${comma}${serialize(value)}`;\n    }, '');\n    return `[${values}]`;\n  }\n\n  const values = Object.keys(object).sort().reduce((t, cv) => {\n    if (object[cv] === undefined ||\n        typeof object[cv] === 'symbol') {\n      return t;\n    }\n    const comma = t.length === 0 ? '' : ',';\n    return `${t}${comma}${serialize(cv)}:${serialize(object[cv])}`;\n  }, '');\n  return `{${values}}`;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvY2Fub25pY2FsaXplL2xpYi9jYW5vbmljYWxpemUuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNhOztBQUViO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLEVBQUUsRUFBRSxNQUFNLEVBQUUsaUJBQWlCO0FBQzdDLEtBQUs7QUFDTCxlQUFlLE9BQU87QUFDdEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxFQUFFLEVBQUUsTUFBTSxFQUFFLGNBQWMsR0FBRyxzQkFBc0I7QUFDakUsR0FBRztBQUNILFdBQVcsRUFBRSxRQUFRO0FBQ3JCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY2RwLXRlc3QtYWdlbnQvLi9ub2RlX21vZHVsZXMvY2Fub25pY2FsaXplL2xpYi9jYW5vbmljYWxpemUuanM/NDVlYSJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG4vKiBqc2xpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNlcmlhbGl6ZSAob2JqZWN0KSB7XG4gIGlmICh0eXBlb2Ygb2JqZWN0ID09PSAnbnVtYmVyJyAmJiBpc05hTihvYmplY3QpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOYU4gaXMgbm90IGFsbG93ZWQnKTtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqZWN0ID09PSAnbnVtYmVyJyAmJiAhaXNGaW5pdGUob2JqZWN0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdHkgaXMgbm90IGFsbG93ZWQnKTtcbiAgfVxuXG4gIGlmIChvYmplY3QgPT09IG51bGwgfHwgdHlwZW9mIG9iamVjdCAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqZWN0KTtcbiAgfVxuXG4gIGlmIChvYmplY3QudG9KU09OIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gc2VyaWFsaXplKG9iamVjdC50b0pTT04oKSk7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmplY3QpKSB7XG4gICAgY29uc3QgdmFsdWVzID0gb2JqZWN0LnJlZHVjZSgodCwgY3YsIGNpKSA9PiB7XG4gICAgICBjb25zdCBjb21tYSA9IGNpID09PSAwID8gJycgOiAnLCc7XG4gICAgICBjb25zdCB2YWx1ZSA9IGN2ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGN2ID09PSAnc3ltYm9sJyA/IG51bGwgOiBjdjtcbiAgICAgIHJldHVybiBgJHt0fSR7Y29tbWF9JHtzZXJpYWxpemUodmFsdWUpfWA7XG4gICAgfSwgJycpO1xuICAgIHJldHVybiBgWyR7dmFsdWVzfV1gO1xuICB9XG5cbiAgY29uc3QgdmFsdWVzID0gT2JqZWN0LmtleXMob2JqZWN0KS5zb3J0KCkucmVkdWNlKCh0LCBjdikgPT4ge1xuICAgIGlmIChvYmplY3RbY3ZdID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIG9iamVjdFtjdl0gPT09ICdzeW1ib2wnKSB7XG4gICAgICByZXR1cm4gdDtcbiAgICB9XG4gICAgY29uc3QgY29tbWEgPSB0Lmxlbmd0aCA9PT0gMCA/ICcnIDogJywnO1xuICAgIHJldHVybiBgJHt0fSR7Y29tbWF9JHtzZXJpYWxpemUoY3YpfToke3NlcmlhbGl6ZShvYmplY3RbY3ZdKX1gO1xuICB9LCAnJyk7XG4gIHJldHVybiBgeyR7dmFsdWVzfX1gO1xufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/canonicalize/lib/canonicalize.js\n");

/***/ })

};
;