import { FromInfo } from "@ckb-lumos/common-scripts/src";

import { CkbAccount, MultisigAccount } from "./ckb_account";

export function asyncSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calcFromInfos(from: CkbAccount): FromInfo[] {
  let froms: FromInfo[];
  if (from instanceof MultisigAccount) {
    const account: MultisigAccount = from;
    froms = [account.multiSigScript];
  } else {
    froms = [from.address];
  }
  return froms;
}
