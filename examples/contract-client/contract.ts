import { Script } from "@ckb-lumos/lumos";

import { CkbAccount, NormalAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { ContractClient } from "../../src/contract_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from '../config';

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const coinClient = new ContractClient(ckbClient);

  const account = new NormalAccount(PRIVATE_KEYS[0]);

  const typeId = await deploy(ckbClient, coinClient, account);
  await upgrade(ckbClient, coinClient, account, typeId);
}

async function deploy(ckbClient: CkbClient, coinClient: ContractClient, account: CkbAccount): Promise<Script> {
  const [txHash, typeId, scriptConfig] = await coinClient.deploy(account, "examples/contract-client/always-success");
  console.log("deploy contract tx: https://pudge.explorer.nervos.org/transaction/" + txHash);
  console.log("type id: %o", typeId);
  console.log("script config: %o", scriptConfig);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("deploy contract res: " + res.hash);
  }
  return typeId;
}

async function upgrade(ckbClient: CkbClient, coinClient: ContractClient, account: CkbAccount, typeId: Script) {
  const [txHash, scriptConfig] = await coinClient.upgrade(account, typeId, "examples/contract-client/always-success");
  console.log("upgrade contract tx: https://pudge.explorer.nervos.org/transaction/" + txHash);
  console.log("script config: %o", scriptConfig);

  const res = await ckbClient.waitForTransaction(txHash);
  if (res) {
    console.log("upgrade contract res: " + res.hash);
  }
}

main();

/*
$ ts-node examples/contract-client/contract.ts
deploy contract tx: https://pudge.explorer.nervos.org/transaction/0x7fbd6bc92d9c2a15fa840bf0ee0b33bf78a0629bc389033c923a4816ca296393
type id: {
  code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
  hash_type: 'type',
  args: '0x7e94374503a0c1dbaf7583ca675621bbec423c639a60f90711e4994c19e532e2'
}
script config: {
  CODE_HASH: '0x4e895285c38a41c59f325335964ab15f4fc232da13828d10cd4cfe8d4bd54b80',
  HASH_TYPE: 'type',
  TX_HASH: '0xdb871df90b9b92f4c5b0fd6d9e98bbe448b1cc6a8825f28a30f994a9e25f1387',
  INDEX: '0x0',
  DEP_TYPE: 'code'
}
deploy contract res: 0x7fbd6bc92d9c2a15fa840bf0ee0b33bf78a0629bc389033c923a4816ca296393
upgrade contract tx: https://pudge.explorer.nervos.org/transaction/0x6409eb92665dab957b7920344f3214f6942b13b75fe49ce0b4b1e72d803dd46a
script config: {
  CODE_HASH: '0x4e895285c38a41c59f325335964ab15f4fc232da13828d10cd4cfe8d4bd54b80',
  HASH_TYPE: 'type',
  TX_HASH: '0x3884133de49253a42ccbd501b0eecd07a02621e880e1a9c1007771c68702f1fb',
  INDEX: '0x0',
  DEP_TYPE: 'code'
}
upgrade contract res: 0x6409eb92665dab957b7920344f3214f6942b13b75fe49ce0b4b1e72d803dd46a
*/
