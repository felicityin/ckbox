import { Script } from "@ckb-lumos/lumos";

import { CkbAccount, MultisigAccount } from "../../src/ckb_account";
import { CkbClient } from "../../src/ckb_client";
import { ContractClient } from "../../src/contract_client";
import { CKB_RPC_URL, CKB_INDEXER_URL, PRIVATE_KEYS } from '../env';

async function main() {
  const ckbClient = new CkbClient(CKB_RPC_URL, CKB_INDEXER_URL);
  const coinClient = new ContractClient(ckbClient);

  const account = new MultisigAccount(PRIVATE_KEYS, 2, 2);

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
$ ts-node examples/contract-client/contract_multisig.ts 
deploy contract tx: https://pudge.explorer.nervos.org/transaction/0xdb008a6d5b5da47cdbd22df11f9a918eeedb6fc969798efd7cf2ebf0f6be6270
type id: {
  code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
  hash_type: 'type',
  args: '0x31de702606bba1f1adf8f27264acbcec1b6d1b9b5c84833862589cb195351557'
}
script config: {
  CODE_HASH: '0x62ba0b8cad126029ce9690003d4506d1ad2d96f70c3ddcfb05259d96abd9c387',
  HASH_TYPE: 'type',
  TX_HASH: '0x41cf13e80b7668dbdc1d3a2285ae29ffc913deac82f68ddf08e458d6e7f08a49',
  INDEX: '0x0',
  DEP_TYPE: 'code'
}
deploy contract res: 0xdb008a6d5b5da47cdbd22df11f9a918eeedb6fc969798efd7cf2ebf0f6be6270
upgrade contract tx: https://pudge.explorer.nervos.org/transaction/0x235aa8dadbd880e319b3b5cd982210837a3f0a298cb2240c04582e9dab48d53c
script config: {
  CODE_HASH: '0x62ba0b8cad126029ce9690003d4506d1ad2d96f70c3ddcfb05259d96abd9c387',
  HASH_TYPE: 'type',
  TX_HASH: '0xe34c8314681e4c2dfeb40c206be9aee295c4504aa07828fb5c2d1a8d700b444f',
  INDEX: '0x0',
  DEP_TYPE: 'code'
}
upgrade contract res: 0x235aa8dadbd880e319b3b5cd982210837a3f0a298cb2240c04582e9dab48d53c
*/