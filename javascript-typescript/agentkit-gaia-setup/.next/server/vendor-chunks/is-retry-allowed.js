"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-retry-allowed";
exports.ids = ["vendor-chunks/is-retry-allowed"];
exports.modules = {

/***/ "(rsc)/./node_modules/is-retry-allowed/index.js":
/*!************************************************!*\
  !*** ./node_modules/is-retry-allowed/index.js ***!
  \************************************************/
/***/ ((module) => {

eval("\n\nconst denyList = new Set([\n\t'ENOTFOUND',\n\t'ENETUNREACH',\n\n\t// SSL errors from https://github.com/nodejs/node/blob/fc8e3e2cdc521978351de257030db0076d79e0ab/src/crypto/crypto_common.cc#L301-L328\n\t'UNABLE_TO_GET_ISSUER_CERT',\n\t'UNABLE_TO_GET_CRL',\n\t'UNABLE_TO_DECRYPT_CERT_SIGNATURE',\n\t'UNABLE_TO_DECRYPT_CRL_SIGNATURE',\n\t'UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY',\n\t'CERT_SIGNATURE_FAILURE',\n\t'CRL_SIGNATURE_FAILURE',\n\t'CERT_NOT_YET_VALID',\n\t'CERT_HAS_EXPIRED',\n\t'CRL_NOT_YET_VALID',\n\t'CRL_HAS_EXPIRED',\n\t'ERROR_IN_CERT_NOT_BEFORE_FIELD',\n\t'ERROR_IN_CERT_NOT_AFTER_FIELD',\n\t'ERROR_IN_CRL_LAST_UPDATE_FIELD',\n\t'ERROR_IN_CRL_NEXT_UPDATE_FIELD',\n\t'OUT_OF_MEM',\n\t'DEPTH_ZERO_SELF_SIGNED_CERT',\n\t'SELF_SIGNED_CERT_IN_CHAIN',\n\t'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',\n\t'UNABLE_TO_VERIFY_LEAF_SIGNATURE',\n\t'CERT_CHAIN_TOO_LONG',\n\t'CERT_REVOKED',\n\t'INVALID_CA',\n\t'PATH_LENGTH_EXCEEDED',\n\t'INVALID_PURPOSE',\n\t'CERT_UNTRUSTED',\n\t'CERT_REJECTED',\n\t'HOSTNAME_MISMATCH'\n]);\n\n// TODO: Use `error?.code` when targeting Node.js 14\nmodule.exports = error => !denyList.has(error && error.code);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXMtcmV0cnktYWxsb3dlZC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jZHAtdGVzdC1hZ2VudC8uL25vZGVfbW9kdWxlcy9pcy1yZXRyeS1hbGxvd2VkL2luZGV4LmpzPzdkN2IiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBkZW55TGlzdCA9IG5ldyBTZXQoW1xuXHQnRU5PVEZPVU5EJyxcblx0J0VORVRVTlJFQUNIJyxcblxuXHQvLyBTU0wgZXJyb3JzIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvZmM4ZTNlMmNkYzUyMTk3ODM1MWRlMjU3MDMwZGIwMDc2ZDc5ZTBhYi9zcmMvY3J5cHRvL2NyeXB0b19jb21tb24uY2MjTDMwMS1MMzI4XG5cdCdVTkFCTEVfVE9fR0VUX0lTU1VFUl9DRVJUJyxcblx0J1VOQUJMRV9UT19HRVRfQ1JMJyxcblx0J1VOQUJMRV9UT19ERUNSWVBUX0NFUlRfU0lHTkFUVVJFJyxcblx0J1VOQUJMRV9UT19ERUNSWVBUX0NSTF9TSUdOQVRVUkUnLFxuXHQnVU5BQkxFX1RPX0RFQ09ERV9JU1NVRVJfUFVCTElDX0tFWScsXG5cdCdDRVJUX1NJR05BVFVSRV9GQUlMVVJFJyxcblx0J0NSTF9TSUdOQVRVUkVfRkFJTFVSRScsXG5cdCdDRVJUX05PVF9ZRVRfVkFMSUQnLFxuXHQnQ0VSVF9IQVNfRVhQSVJFRCcsXG5cdCdDUkxfTk9UX1lFVF9WQUxJRCcsXG5cdCdDUkxfSEFTX0VYUElSRUQnLFxuXHQnRVJST1JfSU5fQ0VSVF9OT1RfQkVGT1JFX0ZJRUxEJyxcblx0J0VSUk9SX0lOX0NFUlRfTk9UX0FGVEVSX0ZJRUxEJyxcblx0J0VSUk9SX0lOX0NSTF9MQVNUX1VQREFURV9GSUVMRCcsXG5cdCdFUlJPUl9JTl9DUkxfTkVYVF9VUERBVEVfRklFTEQnLFxuXHQnT1VUX09GX01FTScsXG5cdCdERVBUSF9aRVJPX1NFTEZfU0lHTkVEX0NFUlQnLFxuXHQnU0VMRl9TSUdORURfQ0VSVF9JTl9DSEFJTicsXG5cdCdVTkFCTEVfVE9fR0VUX0lTU1VFUl9DRVJUX0xPQ0FMTFknLFxuXHQnVU5BQkxFX1RPX1ZFUklGWV9MRUFGX1NJR05BVFVSRScsXG5cdCdDRVJUX0NIQUlOX1RPT19MT05HJyxcblx0J0NFUlRfUkVWT0tFRCcsXG5cdCdJTlZBTElEX0NBJyxcblx0J1BBVEhfTEVOR1RIX0VYQ0VFREVEJyxcblx0J0lOVkFMSURfUFVSUE9TRScsXG5cdCdDRVJUX1VOVFJVU1RFRCcsXG5cdCdDRVJUX1JFSkVDVEVEJyxcblx0J0hPU1ROQU1FX01JU01BVENIJ1xuXSk7XG5cbi8vIFRPRE86IFVzZSBgZXJyb3I/LmNvZGVgIHdoZW4gdGFyZ2V0aW5nIE5vZGUuanMgMTRcbm1vZHVsZS5leHBvcnRzID0gZXJyb3IgPT4gIWRlbnlMaXN0LmhhcyhlcnJvciAmJiBlcnJvci5jb2RlKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/is-retry-allowed/index.js\n");

/***/ })

};
;