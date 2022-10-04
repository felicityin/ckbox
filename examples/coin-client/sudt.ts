import { BIish } from "@ckb-lumos/bi";
import { Script } from "@ckb-lumos/lumos";
import { CkbAccount, NormalAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { CoinClient } from "../../src/coin_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from "../config";

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const coinClient = new CoinClient(ckbClient);

  const account1 = new NormalAccount(PRIVATE_KEYS[0]);
  const account2 = new NormalAccount(PRIVATE_KEYS[1]);

  await issueSudt(ckbClient, coinClient, account1);
  await transferSudt(ckbClient, coinClient, account1, account2);
}

async function issueSudt(
  ckbClient: CkbClient,
  coinClient: CoinClient,
  account: CkbAccount
): Promise<Script> {
  const txHash = await coinClient.issueToken(account, 10000n);
  console.log(
    "issue sudt tx: https://pudge.explorer.nervos.org/transaction/" + txHash
  );

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("issue sudt res: " + res.hash);
  }

  const sudt = await coinClient.calcSudtScript(account);
  console.log("sudt: %o", sudt);
  const sudtBalance = await coinClient.getSudtBalance(account.address, sudt);
  console.log("account1 sudt balance: " + sudtBalance);
  return sudt;
}

async function transferSudt(
  ckbClient: CkbClient,
  coinClient: CoinClient,
  fromAccount: CkbAccount,
  toAccount: CkbAccount
) {
  const sudt = coinClient.calcToken(fromAccount);
  const to: Map<string, BIish> = new Map([[toAccount.address, 100n]]);
  const txHash = await coinClient.transferSudt(fromAccount, to, sudt);
  console.log(
    "transfer sudt tx: https://pudge.explorer.nervos.org/transaction/" + txHash
  );

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("transfer sudt res: " + res.hash);
  }

  const sudtScript = await coinClient.calcSudtScript(fromAccount);
  const sudtBalanceAfter = await coinClient.getSudtBalance(
    fromAccount.address,
    sudtScript
  );
  console.log("account1 sudt balance: " + sudtBalanceAfter);
  const sudtBalanceAfter2 = await coinClient.getSudtBalance(
    toAccount.address,
    sudtScript
  );
  console.log("account2 sudt balance: " + sudtBalanceAfter2);
}

main();

/*
$ ts-node examples/coin-client/sudt.ts
issue sudt tx: https://pudge.explorer.nervos.org/transaction/0x9220dc88bbc4e4e6dd3c68513dc6cda517c98316e4914e5d35af8a5b0e5c82fa
issue sudt res: 0x9220dc88bbc4e4e6dd3c68513dc6cda517c98316e4914e5d35af8a5b0e5c82fa
sudt: {
  code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
  hash_type: 'type',
  args: '0xa72c5a7edf75d607149bc25895b22f08263a7b542830d8abffd1467ed2403574'
}
account1 sudt balance: 10000
transfer sudt tx: https://pudge.explorer.nervos.org/transaction/0x9401ad4911e909e098cbcd38f661cdb0a47fc5a7d750f60768dca3516eeec6aa
account1 sudt balance: 9900
account2 sudt balance: 100
*/
