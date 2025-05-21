import { AxiosInstance } from 'axios';
import { evm } from 'x402/types';
import { PaymentRequirementsSelector } from 'x402/client';
import { Account } from 'viem';
export { decodeXPaymentResponse } from 'x402/shared';

/**
 * Enables the payment of APIs using the x402 payment protocol.
 *
 * When a request receives a 402 response:
 * 1. Extracts payment requirements from the response
 * 2. Creates a payment header using the provided wallet client
 * 3. Retries the original request with the payment header
 * 4. Exposes the X-PAYMENT-RESPONSE header in the final response
 *
 * @param axiosClient - The Axios instance to add the interceptor to
 * @param walletClient - A wallet client that can sign transactions and create payment headers
 * @param paymentRequirementsSelector - A function that selects the payment requirements from the response
 * @returns The modified Axios instance with the payment interceptor
 *
 * @example
 * ```typescript
 * const client = withPaymentInterceptor(
 *   axios.create(),
 *   signer
 * );
 *
 * // The client will automatically handle 402 responses
 * const response = await client.get('https://api.example.com/premium-content');
 * ```
 */
declare function withPaymentInterceptor(axiosClient: AxiosInstance, walletClient: typeof evm.SignerWallet | Account, paymentRequirementsSelector?: PaymentRequirementsSelector): AxiosInstance;

export { withPaymentInterceptor };
