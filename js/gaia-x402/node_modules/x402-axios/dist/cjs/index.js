"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  decodeXPaymentResponse: () => import_shared.decodeXPaymentResponse,
  withPaymentInterceptor: () => withPaymentInterceptor
});
module.exports = __toCommonJS(src_exports);
var import_types = require("x402/types");
var import_types2 = require("x402/types");
var import_client = require("x402/client");
var import_shared = require("x402/shared");
function withPaymentInterceptor(axiosClient, walletClient, paymentRequirementsSelector = import_client.selectPaymentRequirements) {
  axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      var _a, _b, _c;
      if (!error.response || error.response.status !== 402) {
        return Promise.reject(error);
      }
      try {
        const originalConfig = error.config;
        if (!originalConfig || !originalConfig.headers) {
          return Promise.reject(new Error("Missing axios request configuration"));
        }
        if (originalConfig.__is402Retry) {
          return Promise.reject(error);
        }
        const { x402Version, accepts } = error.response.data;
        const parsed = accepts.map((x) => import_types.PaymentRequirementsSchema.parse(x));
        const chainId = import_types2.evm.isSignerWallet(walletClient) ? (_a = walletClient.chain) == null ? void 0 : _a.id : import_types2.evm.isAccount(walletClient) ? (_c = (_b = walletClient.client) == null ? void 0 : _b.chain) == null ? void 0 : _c.id : void 0;
        const selectedPaymentRequirements = paymentRequirementsSelector(
          parsed,
          chainId ? import_types.ChainIdToNetwork[chainId] : void 0,
          "exact"
        );
        const paymentHeader = await (0, import_client.createPaymentHeader)(
          walletClient,
          x402Version,
          selectedPaymentRequirements
        );
        originalConfig.__is402Retry = true;
        originalConfig.headers["X-PAYMENT"] = paymentHeader;
        originalConfig.headers["Access-Control-Expose-Headers"] = "X-PAYMENT-RESPONSE";
        const secondResponse = await axiosClient.request(originalConfig);
        return secondResponse;
      } catch (paymentError) {
        return Promise.reject(paymentError);
      }
    }
  );
  return axiosClient;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  decodeXPaymentResponse,
  withPaymentInterceptor
});
//# sourceMappingURL=index.js.map