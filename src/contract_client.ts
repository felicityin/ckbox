import { readFileSync } from 'fs';

import { BIish } from "@ckb-lumos/bi";
import { Script } from "@ckb-lumos/lumos";
import { generateDeployWithTypeIdTx, generateUpgradeTypeIdDataTx } from "@ckb-lumos/common-scripts/lib/deploy";

import { CkbClient } from "./ckb_client";
import { CkbAccount } from "./ckb_account";
import { ScriptConfig } from "./types";
import { calcFromInfos } from './utils';

export class ContractClient {
  ckbClient: CkbClient;

  constructor(ckbClient: CkbClient) {
    this.ckbClient = ckbClient;
  }

  public async deploy(
    account: CkbAccount,
    contractBinPath: string,
    fee?: BIish
  ): Promise<[string, Script, ScriptConfig]> {
    const contractBin = readFileSync(contractBinPath);

    const result = await generateDeployWithTypeIdTx({
      cellProvider: this.ckbClient.indexer,
      fromInfo: calcFromInfos(account)[0],
      scriptBinary: contractBin,
      config: this.ckbClient.config,
    });

    const txHash = await this.ckbClient.submitTransaction(result.txSkeleton, account, fee);
    return [txHash, result.typeId, result.scriptConfig];
  }

  public async upgrade(
    account: CkbAccount,
    typeId: Script,
    newContractBinPath: string,
    fee?: BIish
  ): Promise<[string, ScriptConfig]> {
    const newContractBin = readFileSync(newContractBinPath);

    const result = await generateUpgradeTypeIdDataTx({
      cellProvider: this.ckbClient.indexer,
      fromInfo: calcFromInfos(account)[0],
      scriptBinary: newContractBin,
      config: this.ckbClient.config,
      typeId,
    });

    const txHash = await this.ckbClient.submitTransaction(result.txSkeleton, account, fee);
    return [txHash, result.scriptConfig];
  }
}
