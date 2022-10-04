import { BIish } from "@ckb-lumos/bi";
import { MultisigAccount, NormalAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { CoinClient } from "../../src/coin_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from '../config';

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const coinClient = new CoinClient(ckbClient);

  const account1 = new MultisigAccount(PRIVATE_KEYS, 2, 2);
  const account2 = new NormalAccount(PRIVATE_KEYS[1]);

  const ckbBalance1Before = await coinClient.getCkbBalance(account1.address);
  console.log("account1 ckb balance: " + ckbBalance1Before);
  const ckbBalance2Before = await coinClient.getCkbBalance(account2.address);
  console.log("account2 ckb balance: " + ckbBalance2Before);

  const to: Map<string, BIish> = new Map([
    [account2.address, 100e8],
  ]); 
  const txHash = await coinClient.transferCkb(account1, to);
  console.log("transfer ckb tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

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
$ ts-node examples/coin-client/transfer_ckb_multisig.ts
account1 ckb balance: 123899981174
account2 ckb balance: 2100000000000
transfer ckb tx: https://pudge.explorer.nervos.org/transaction/0xfd14c3c201818465025977c997387c4178a7e09ca5c78757c7a4075b6c0b685c
transfer ckb res: 0xfd14c3c201818465025977c997387c4178a7e09ca5c78757c7a4075b6c0b685c
account1 ckb balance: 113899980601
account2 ckb balance: 2110000000000
transfered: 10000000000
*/
