// src/index.ts
import { exact } from "x402/schemes";
import {
  computeRoutePatterns,
  findMatchingPaymentRequirements,
  findMatchingRoute,
  getPaywallHtml,
  processPriceToAtomicAmount,
  toJsonSafe
} from "x402/shared";
import {
  moneySchema,
  settleResponseHeader
} from "x402/types";
import { useFacilitator } from "x402/verify";
function paymentMiddleware(payTo, routes, facilitator) {
  const { verify, settle } = useFacilitator(facilitator);
  const x402Version = 1;
  const routePatterns = computeRoutePatterns(routes);
  return async function paymentMiddleware2(req, res, next) {
    const matchingRoute = findMatchingRoute(routePatterns, req.path, req.method.toUpperCase());
    if (!matchingRoute) {
      return next();
    }
    const { price, network, config = {} } = matchingRoute.config;
    const { description, mimeType, maxTimeoutSeconds, outputSchema, customPaywallHtml, resource } = config;
    const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
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
          const parsed = moneySchema.safeParse(price);
          if (parsed.success) {
            displayAmount = parsed.data;
          } else {
            displayAmount = Number.NaN;
          }
        } else {
          displayAmount = Number(price.amount) / 10 ** price.asset.decimals;
        }
        const html = customPaywallHtml || getPaywallHtml({
          amount: displayAmount,
          paymentRequirements: toJsonSafe(paymentRequirements),
          currentUrl: req.originalUrl,
          testnet: network === "base-sepolia"
        });
        res.status(402).send(html);
        return;
      }
      res.status(402).json({
        x402Version,
        error: "X-PAYMENT header is required",
        accepts: toJsonSafe(paymentRequirements)
      });
      return;
    }
    let decodedPayment;
    try {
      decodedPayment = exact.evm.decodePayment(payment);
      decodedPayment.x402Version = x402Version;
    } catch (error) {
      res.status(402).json({
        x402Version,
        error: error || "Invalid or malformed payment header",
        accepts: toJsonSafe(paymentRequirements)
      });
      return;
    }
    const selectedPaymentRequirements = findMatchingPaymentRequirements(
      paymentRequirements,
      decodedPayment
    );
    if (!selectedPaymentRequirements) {
      res.status(402).json({
        x402Version,
        error: "Unable to find matching payment requirements",
        accepts: toJsonSafe(paymentRequirements)
      });
      return;
    }
    try {
      const response = await verify(decodedPayment, selectedPaymentRequirements);
      if (!response.isValid) {
        res.status(402).json({
          x402Version,
          error: response.invalidReason,
          accepts: toJsonSafe(paymentRequirements),
          payer: response.payer
        });
        return;
      }
    } catch (error) {
      res.status(402).json({
        x402Version,
        error,
        accepts: toJsonSafe(paymentRequirements)
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
      const responseHeader = settleResponseHeader(settleResponse);
      res.setHeader("X-PAYMENT-RESPONSE", responseHeader);
    } catch (error) {
      if (!res.headersSent) {
        res.status(402).json({
          x402Version,
          error,
          accepts: toJsonSafe(paymentRequirements)
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
export {
  paymentMiddleware
};
//# sourceMappingURL=index.mjs.map