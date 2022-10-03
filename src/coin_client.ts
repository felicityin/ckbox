import { BIish } from "@ckb-lumos/bi";
import { sudt } from "@ckb-lumos/common-scripts";
import { parseAddress } from "@ckb-lumos/helpers";
import { Address, commons, helpers, Script } from "@ckb-lumos/lumos";
import { readBigUInt128LE } from "@lay2/pw-core"

import { CkbClient } from "./ckb_client";
import { CkbAccount } from "./ckb_account";
import { ScriptType } from "./types";
import { getFromInfos } from './utils';

export class CoinClient {
  ckbClient: CkbClient;

  constructor(ckbClient: CkbClient) {
    this.ckbClient = ckbClient;
  }

  /**
   * @param from
   * @param to
   * @param fee
   * @returns transaction hash
   */
  public async transferCkb(
    from: CkbAccount,
    to: Map<Address, BIish>,
    fee?: BIish,
  ): Promise<string> {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.ckbClient.indexer });

    const config = this.ckbClient.netConfig;
    for (var [toAddress, amount] of to) {
      txSkeleton = await commons.common.transfer(
        txSkeleton,
        getFromInfos(from),
        toAddress,
        amount,
        undefined,
        undefined,
        { config }
      );
    };

    txSkeleton = await this.ckbClient.payFee(txSkeleton, from, fee);
    const sealedTx = await this.ckbClient.signTransaction(txSkeleton, from);
    return await this.ckbClient.submitTransaction(sealedTx);
  }

  /**
   * @param from 
   * @param to 
   * @param sudtToken 
   * @param fee 
   * @returns transaction hash
   */
  public async transferSudt(
    from: CkbAccount,
    to: Map<Address, BIish>,
    sudtToken: string,
    fee?: BIish,
  ): Promise<string> {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.ckbClient.indexer });

    const config = this.ckbClient.netConfig;
    for (var [toAddress, amount] of to) {
      txSkeleton = await sudt.transfer(
        txSkeleton,
        getFromInfos(from),
        sudtToken,
        toAddress,
        amount,
        undefined,
        undefined,
        undefined,
        { config }
      );
    }

    txSkeleton = await this.ckbClient.payFee(txSkeleton, from, fee);
    const sealedTx = await this.ckbClient.signTransaction(txSkeleton, from);
    return await this.ckbClient.submitTransaction(sealedTx);
  }

  public async getCkbBalance(address: string): Promise<bigint> {
    const lock = parseAddress(address, { config: this.ckbClient.netConfig });
    const searchKey = {
      script: lock,
      script_type: ScriptType.lock,
    };
    const cells = (await this.ckbClient.indexer.getCells(searchKey)).objects.filter((cell) => !cell.cell_output.type);
    const balance = cells.map((cell) => BigInt(cell.cell_output.capacity)).reduce((p, c) => p + c, 0n);
    return balance;
  }

  public async getSudtBalance(address: string, udt: Script): Promise<bigint> {
    const lock = parseAddress(address, { config: this.ckbClient.netConfig });
    const searchKey = {
      script: lock,
      script_type: ScriptType.lock,
      filters: {
        script: udt,
      },
    };
    const cells = (await this.ckbClient.indexer.getCells(searchKey)).objects.filter((cell) => !cell.cell_output.type);
    const balance = cells.map((cell) => this.getSUDTAmount(cell.data)).reduce((p, c) => p + c, 0n);
    return balance;
  }

  getSUDTAmount(cellData: string): bigint {
    const sudtAmountData = cellData.slice(0, 34);
    return BigInt(`0x${readBigUInt128LE(sudtAmountData).toString(16)}`);
  }

  public async issueToken(from: CkbAccount, amount: BIish, fee?: BIish): Promise<[string, Script]> {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.ckbClient.indexer });

    await sudt.issueToken(
      txSkeleton,
      getFromInfos(from)[0],
      amount,
      undefined,
      undefined,
      { config: this.ckbClient.netConfig}
    );

    txSkeleton = await this.ckbClient.payFee(txSkeleton, from, fee);
    const sealedTx = await this.ckbClient.signTransaction(txSkeleton, from);
    const txHash = await this.ckbClient.submitTransaction(sealedTx);
    const sudtScript = txSkeleton.get("outputs").get(0)!.cell_output.type;
    return [txHash, sudtScript!];
  }
}
