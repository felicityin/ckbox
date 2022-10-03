import { BIish } from "@ckb-lumos/bi";
import { Script } from "@ckb-lumos/lumos";
import { CkbAccount, MultisigAccount, NormalAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { CoinClient } from "../../src/coin_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from '../env';

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const coinClient = new CoinClient(ckbClient);

  const account1 = new MultisigAccount(PRIVATE_KEYS, 2, 2);
  const account2 = new NormalAccount(PRIVATE_KEYS[1]);

  const sudt = await issueSudt(ckbClient, coinClient, account1);
  await transferSudt(ckbClient, coinClient, account1, account2, sudt);
}

async function issueSudt(ckbClient: CkbClient, coinClient: CoinClient, account: CkbAccount): Promise<Script> {
  const [txHash, sudt] = await coinClient.issueToken(account, 10000n);
  console.log("sudt: %o", sudt);
  console.log("issue sudt tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("issue sudt res: " + res.hash);
  }

  const sudtBalance = await coinClient.getSudtBalance(account.address, sudt);
  console.log("account1 sudt balance: " + sudtBalance);
  return sudt;
}

async function transferSudt(
  ckbClient: CkbClient,
  coinClient: CoinClient,
  fromAccount: CkbAccount,
  toAccount: CkbAccount,
  sudt: Script,
 ) {
  const to: Map<string, BIish> = new Map([
    [toAccount.address, 100n],
  ]); 
  const txHash = await coinClient.transferSudt(fromAccount, to, sudt.args);
  console.log("transfer sudt tx: https://pudge.explorer.nervos.org/transaction/" + txHash);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("transfer sudt res: " + res.hash);
  }

  const sudtBalanceAfter = await coinClient.getSudtBalance(fromAccount.address, sudt);
  console.log("account1 sudt balance: " + sudtBalanceAfter);
  const sudtBalanceAfter2 = await coinClient.getSudtBalance(fromAccount.address, sudt);
  console.log("account2 sudt balance: " + sudtBalanceAfter2);
}

main();

/*
output:
*/
