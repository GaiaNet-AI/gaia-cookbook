import { zeroAddress } from "viem";
import { sendUserOp } from "./bundler";
import {
  MetaMaskSmartAccount,
  Implementation,
} from "@metamask/delegation-toolkit";

export async function deploySmartAccount(
  smartAccount: MetaMaskSmartAccount<Implementation.Hybrid>
) {
  const receipt = await sendUserOp(smartAccount, [{ to: zeroAddress }]);
  return {
    receipt,
  };
}
