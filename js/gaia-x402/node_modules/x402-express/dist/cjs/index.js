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
  paymentMiddleware: () => paymentMiddleware
});
module.exports = __toCommonJS(src_exports);
var import_schemes = require("x402/schemes");
var import_shared = require("x402/shared");
var import_types = require("x402/types");
var import_verify = require("x402/verify");
function paymentMiddleware(payTo, routes, facilitator) {
  const { verify, settle } = (0, import_verify.useFacilitator)(facilitator);
  const x402Version = 1;
  const routePatterns = (0, import_shared.computeRoutePatterns)(routes);
  return async function paymentMiddleware2(req, res, next) {
    const matchingRoute = (0, import_shared.findMatchingRoute)(routePatterns, req.path, req.method.toUpperCase());
    if (!matchingRoute) {
      return next();
    }
    const { price, network, config = {} } = matchingRoute.config;
    const { description, mimeType, maxTimeoutSeconds, outputSchema, customPaywallHtml, resource } = config;
    const atomicAmountForAsset = (0, import_shared.processPriceToAtomicAmount)(price, network);
    if ("error" in atomicAmountForAsset) {
      throw new Error(atomicAmountForAsset.error);
    }
    const { maxAmountRequired, asset } = atomicAmountForAsset;
    const resourceUrl = resource || `${req.protocol}://${req.headers.host}${req.path}`;
    const paymentRequirements = [
      {
        scheme: "exact",
        network,
        maxAmountRequired,
        resource: resourceUrl,
        description: description ?? "",
        mimeType: mimeType ?? "",
        payTo,
        maxTimeoutSeconds: maxTimeoutSeconds ?? 60,
        asset: asset.address,
        outputSchema: outputSchema ?? void 0,
        extra: {
          name: asset.eip712.name,
          version: asset.eip712.version
        }
      }
    ];
    const payment = req.header("X-PAYMENT");
    const userAgent = req.header("User-Agent") || "";
    const acceptHeader = req.header("Accept") || "";
    const isWebBrowser = acceptHeader.includes("text/html") && userAgent.includes("Mozilla");
    if (!payment) {
      if (isWebBrowser) {
        let displayAmount;
        if (typeof price === "string" || typeof price === "number") {
          const parsed = import_types.moneySchema.safeParse(price);
          if (parsed.success) {
            displayAmount = parsed.data;
          } else {
            displayAmount = Number.NaN;
          }
        } else {
          displayAmount = Number(price.amount) / 10 ** price.asset.decimals;
        }
        const html = customPaywallHtml || (0, import_shared.getPaywallHtml)({
          amount: displayAmount,
          paymentRequirements: (0, import_shared.toJsonSafe)(paymentRequirements),
          currentUrl: req.originalUrl,
          testnet: network === "base-sepolia"
        });
        res.status(402).send(html);
        return;
      }
      res.status(402).json({
        x402Version,
        error: "X-PAYMENT header is required",
        accepts: (0, import_shared.toJsonSafe)(paymentRequirements)
      });
      return;
    }
    let decodedPayment;
    try {
      decodedPayment = import_schemes.exact.evm.decodePayment(payment);
      decodedPayment.x402Version = x402Version;
    } catch (error) {
      res.status(402).json({
        x402Version,
        error: error || "Invalid or malformed payment header",
        accepts: (0, import_shared.toJsonSafe)(paymentRequirements)
      });
      return;
    }
    const selectedPaymentRequirements = (0, import_shared.findMatchingPaymentRequirements)(
      paymentRequirements,
      decodedPayment
    );
    if (!selectedPaymentRequirements) {
      res.status(402).json({
        x402Version,
        error: "Unable to find matching payment requirements",
        accepts: (0, import_shared.toJsonSafe)(paymentRequirements)
      });
      return;
    }
    try {
      const response = await verify(decodedPayment, selectedPaymentRequirements);
      if (!response.isValid) {
        res.status(402).json({
          x402Version,
          error: response.invalidReason,
          accepts: (0, import_shared.toJsonSafe)(paymentRequirements),
          payer: response.payer
        });
        return;
      }
    } catch (error) {
      res.status(402).json({
        x402Version,
        error,
        accepts: (0, import_shared.toJsonSafe)(paymentRequirements)
      });
      return;
    }
    const originalEnd = res.end.bind(res);
    let endArgs = null;
    res.end = function(...args) {
      endArgs = args;
      return res;
    };
    await next();
    try {
      const settleResponse = await settle(decodedPayment, selectedPaymentRequirements);
      const responseHeader = (0, import_types.settleResponseHeader)(settleResponse);
      res.setHeader("X-PAYMENT-RESPONSE", responseHeader);
    } catch (error) {
      if (!res.headersSent) {
        res.status(402).json({
          x402Version,
          error,
          accepts: (0, import_shared.toJsonSafe)(paymentRequirements)
        });
        return;
      }
    } finally {
      res.end = originalEnd;
      if (endArgs) {
        originalEnd(...endArgs);
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  paymentMiddleware
});
//# sourceMappingURL=index.js.map