"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/svix-fetch";
exports.ids = ["vendor-chunks/svix-fetch"];
exports.modules = {

/***/ "(rsc)/./node_modules/svix-fetch/fetch-npm-node.js":
/*!***************************************************!*\
  !*** ./node_modules/svix-fetch/fetch-npm-node.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar http = __webpack_require__(/*! http */ \"http\");\nvar https = __webpack_require__(/*! https */ \"https\");\nvar realFetch = __webpack_require__(/*! node-fetch */ \"(rsc)/./node_modules/node-fetch/lib/index.mjs\");\n\nconst httpAgent = new http.Agent({\n\tkeepAlive: true\n});\nconst httpsAgent = new https.Agent({\n\tkeepAlive: true\n});\n\nconst agent = function(_parsedURL) {\n\tif (_parsedURL.protocol == 'http:') {\n\t\treturn httpAgent;\n\t} else {\n\t\treturn httpsAgent;\n\t}\n};\n\nmodule.exports = function(url, options) {\n\tif (/^\\/\\//.test(url)) {\n\t\turl = 'https:' + url;\n\t}\n\treturn realFetch.call(this, url, {agent, ...options});\n};\n\nif (!global.fetch) {\n\tglobal.fetch = module.exports;\n\tglobal.Response = realFetch.Response;\n\tglobal.Headers = realFetch.Headers;\n\tglobal.Request = realFetch.Request;\n}//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvc3ZpeC1mZXRjaC9mZXRjaC1ucG0tbm9kZS5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYixXQUFXLG1CQUFPLENBQUMsa0JBQU07QUFDekIsWUFBWSxtQkFBTyxDQUFDLG9CQUFPO0FBQzNCLGdCQUFnQixtQkFBTyxDQUFDLGlFQUFZOztBQUVwQztBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsa0JBQWtCO0FBQ3JEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2NkcC10ZXN0LWFnZW50Ly4vbm9kZV9tb2R1bGVzL3N2aXgtZmV0Y2gvZmV0Y2gtbnBtLW5vZGUuanM/NTk2ZCJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxudmFyIGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG52YXIgaHR0cHMgPSByZXF1aXJlKCdodHRwcycpO1xudmFyIHJlYWxGZXRjaCA9IHJlcXVpcmUoJ25vZGUtZmV0Y2gnKTtcblxuY29uc3QgaHR0cEFnZW50ID0gbmV3IGh0dHAuQWdlbnQoe1xuXHRrZWVwQWxpdmU6IHRydWVcbn0pO1xuY29uc3QgaHR0cHNBZ2VudCA9IG5ldyBodHRwcy5BZ2VudCh7XG5cdGtlZXBBbGl2ZTogdHJ1ZVxufSk7XG5cbmNvbnN0IGFnZW50ID0gZnVuY3Rpb24oX3BhcnNlZFVSTCkge1xuXHRpZiAoX3BhcnNlZFVSTC5wcm90b2NvbCA9PSAnaHR0cDonKSB7XG5cdFx0cmV0dXJuIGh0dHBBZ2VudDtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gaHR0cHNBZ2VudDtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1cmwsIG9wdGlvbnMpIHtcblx0aWYgKC9eXFwvXFwvLy50ZXN0KHVybCkpIHtcblx0XHR1cmwgPSAnaHR0cHM6JyArIHVybDtcblx0fVxuXHRyZXR1cm4gcmVhbEZldGNoLmNhbGwodGhpcywgdXJsLCB7YWdlbnQsIC4uLm9wdGlvbnN9KTtcbn07XG5cbmlmICghZ2xvYmFsLmZldGNoKSB7XG5cdGdsb2JhbC5mZXRjaCA9IG1vZHVsZS5leHBvcnRzO1xuXHRnbG9iYWwuUmVzcG9uc2UgPSByZWFsRmV0Y2guUmVzcG9uc2U7XG5cdGdsb2JhbC5IZWFkZXJzID0gcmVhbEZldGNoLkhlYWRlcnM7XG5cdGdsb2JhbC5SZXF1ZXN0ID0gcmVhbEZldGNoLlJlcXVlc3Q7XG59Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/svix-fetch/fetch-npm-node.js\n");

/***/ })

};
;