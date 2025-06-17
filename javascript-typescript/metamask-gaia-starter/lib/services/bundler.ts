import type {
  Implementation,
  MetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { lineaSepolia as chain } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import {
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import { http } from "viem";

export const paymasterClient = createPaymasterClient({
  transport: http(process.env.NEXT_PUBLIC_BUNDLER_URL),
});

export const bundler = createBundlerClient({
  transport: http(process.env.NEXT_PUBLIC_BUNDLER_URL),
  paymaster: paymasterClient,
  chain,
});

export const pimlicoClient = createPimlicoClient({
  transport: http(process.env.NEXT_PUBLIC_BUNDLER_URL),
});

export const sendUserOp = async (
  smartAccount: MetaMaskSmartAccount<Implementation.Hybrid>,
  calls: readonly unknown[]
) => {
  const { fast: fees } = await pimlicoClient.getUserOperationGasPrice();

  const userOpHash = await bundler.sendUserOperation({
    account: smartAccount,
    calls,
    ...fees,
  });

  const receipt = await bundler.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return receipt;
};
