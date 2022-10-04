import { BIish } from "@ckb-lumos/bi";
import { Script } from "@ckb-lumos/lumos";
import { CkbAccount, MultisigAccount, NormalAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { CoinClient } from "../../src/coin_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from '../config';

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const coinClient = new CoinClient(ckbClient);

  const account1 = new MultisigAccount(PRIVATE_KEYS, 2, 2);
  const account2 = new NormalAccount(PRIVATE_KEYS[1]);

  await issueSudt(ckbClient, coinClient, account1);
  await transferSudt(ckbClient, coinClient, account1, account2);
}

async function issueSudt(ckbClient: CkbClient, coinClient: CoinClient, account: CkbAccount): Promise<Script> {
  const txHash = await coinClient.issueToken(account, 10000n);
  console.log("issue sudt tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

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
  toAccount: CkbAccount,
 ) {
  const sudt = coinClient.calcToken(fromAccount);
  const to: Map<string, BIish> = new Map([
    [toAccount.address, 100n],
  ]); 
  const txHash = await coinClient.transferSudt(fromAccount, to, sudt);
  console.log("transfer sudt tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("transfer sudt res: " + res.hash);
  }

  const sudtScript = await coinClient.calcSudtScript(fromAccount);
  const sudtBalanceAfter = await coinClient.getSudtBalance(fromAccount.address, sudtScript);
  console.log("account1 sudt balance: " + sudtBalanceAfter);
  const sudtBalanceAfter2 = await coinClient.getSudtBalance(toAccount.address, sudtScript);
  console.log("account2 sudt balance: " + sudtBalanceAfter2);
}

main();

/*
$ ts-node examples/coin-client/sudt_multisig.ts
issue sudt tx: https://pudge.explorer.nervos.org/transaction/0x3ac5374a6c9c10fed57cafca1f967e502066398b34d7d9dfc9b85d7cf6c83b7d
sudt: {
  code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
  hash_type: 'type',
  args: '0x4ff9bbf9007a0b594577891b6127bbddf781bafe66cd723907e96944bec5e541'
}
account1 sudt balance: 10000
transfer sudt tx: https://pudge.explorer.nervos.org/transaction/0x45899b6d21a644f1c748c95846a0a480b5f79c0587822413b0ea1a28b5f8e399
account1 sudt balance: 9900
account2 sudt balance: 100
*/
