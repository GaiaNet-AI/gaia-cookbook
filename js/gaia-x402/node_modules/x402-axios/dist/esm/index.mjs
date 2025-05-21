// src/index.ts
import { ChainIdToNetwork, PaymentRequirementsSchema } from "x402/types";
import { evm } from "x402/types";
import {
  createPaymentHeader,
  selectPaymentRequirements
} from "x402/client";
import { decodeXPaymentResponse } from "x402/shared";
function withPaymentInterceptor(axiosClient, walletClient, paymentRequirementsSelector = selectPaymentRequirements) {
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
        const parsed = accepts.map((x) => PaymentRequirementsSchema.parse(x));
        const chainId = evm.isSignerWallet(walletClient) ? (_a = walletClient.chain) == null ? void 0 : _a.id : evm.isAccount(walletClient) ? (_c = (_b = walletClient.client) == null ? void 0 : _b.chain) == null ? void 0 : _c.id : void 0;
        const selectedPaymentRequirements = paymentRequirementsSelector(
          parsed,
          chainId ? ChainIdToNetwork[chainId] : void 0,
          "exact"
        );
        const paymentHeader = await createPaymentHeader(
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
export {
  decodeXPaymentResponse,
  withPaymentInterceptor
};
//# sourceMappingURL=index.mjs.map