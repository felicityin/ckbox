import { OutPoint } from "@ckb-lumos/lumos";

import { CkbAccount, NormalAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { DaoClient } from "../../src/dao_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from '../config';

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const daoClient = new DaoClient(ckbClient);

  // const account = new MultisigAccount(PRIVATE_KEYS, 2, 2);
  const account = new NormalAccount(PRIVATE_KEYS[0]);

  const txHash = "0x290c7dd9152a355a29691741246d9950235b0ac0ae91e61d9f1fa78b3ce9c343";
  await deposit(ckbClient, daoClient, account, account.address);

  const depositOutpoint = {tx_hash: txHash, index: '0x0'};
  const txHash1 = await withdraw(ckbClient, daoClient, account, depositOutpoint);

  // wait 180 epochs. 30 days.
  // const withdrawOutpoint = {tx_hash: txHash1, index: '0x0'};
  // await unlock(ckbClient, daoClient, account, account.address, depositOutpoint, withdrawOutpoint);
}

async function deposit(ckbClient: CkbClient, daoClient: DaoClient, from: CkbAccount, to: string): Promise<string> {
  const txHash = await daoClient.deposit(from, to, 200e8);
  console.log("deposit tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("deposit res: " + res.hash);
  }

  return txHash;
}

async function withdraw(ckbClient: CkbClient, daoClient: DaoClient, from: CkbAccount, depositOutpoint: OutPoint): Promise<string> {
  const txHash = await daoClient.withdraw(from, depositOutpoint);
  console.log("withdraw tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("withdraw res: " + res.hash);
  }
  return txHash;
}

async function unlock(
  ckbClient: CkbClient,
  daoClient: DaoClient,
  from: CkbAccount,
  to: string,
  depositOutpoint: OutPoint,
  withdrawOutpoint: OutPoint
) {
  const txHash = await daoClient.unlock(from, to, depositOutpoint, withdrawOutpoint);
  console.log("withdraw tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("withdraw res: " + res.hash);
  }
}

main();

/*
$ ts-node examples/dao-client/dao.ts
deposit tx: https://pudge.explorer.nervos.org/transaction/0xaa2ca50852885b1824c681f397942d3c6ee447ed31a2a881831b1272fa270545
deposit res: 0xaa2ca50852885b1824c681f397942d3c6ee447ed31a2a881831b1272fa270545
withdraw tx: https://pudge.explorer.nervos.org/transaction/0x5b5296c9f81f4103b6306b2b34fca1be3732e033675ddf1ea295ea39c633e24c
withdraw res: 0x5b5296c9f81f4103b6306b2b34fca1be3732e033675ddf1ea295ea39c633e24c
*/
