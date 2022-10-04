import { BIish } from "@ckb-lumos/bi";
import { NormalAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { CoinClient } from "../../src/coin_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from "../config";

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const coinClient = new CoinClient(ckbClient);

  const account1 = new NormalAccount(PRIVATE_KEYS[0]);
  const account2 = new NormalAccount(PRIVATE_KEYS[1]);

  const ckbBalance1Before = await coinClient.getCkbBalance(account1.address);
  console.log("account1 ckb balance: " + ckbBalance1Before);
  const ckbBalance2Before = await coinClient.getCkbBalance(account2.address);
  console.log("account2 ckb balance: " + ckbBalance2Before);

  const to: Map<string, BIish> = new Map([[account2.address, 100e8]]);
  const txHash = await coinClient.transferCkb(account1, to);
  console.log(
    "transfer ckb tx: https://pudge.explorer.nervos.org/transaction/" + txHash
  );

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("transfer ckb res: " + res.hash);
  }

  const ckbBalance1After = await coinClient.getCkbBalance(account1.address);
  console.log("account1 ckb balance: " + ckbBalance1After);
  const ckbBalance2After = await coinClient.getCkbBalance(account2.address);
  console.log("account2 ckb balance: " + ckbBalance2After);

  const transfered = ckbBalance2After - ckbBalance2Before;
  console.log("transfered: " + transfered);
}

main();

/*
$ ts-node examples/coin-client/transfer_ckb.ts
account1 ckb balance: 5333399926728
account2 ckb balance: 2090000000000
transfer ckb tx: https://pudge.explorer.nervos.org/transaction/0xc87f76eb35f33164aee21aff01cd62cf25cdb1b7f6520a4a944e382cf8d8084c
transfer ckb res: 0xc87f76eb35f33164aee21aff01cd62cf25cdb1b7f6520a4a944e382cf8d8084c
account1 ckb balance: 5323399926212
account2 ckb balance: 2100000000000
transfered: 10000000000
*/
