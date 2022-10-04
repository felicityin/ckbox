import { utils } from "@ckb-lumos/base";
import { BIish } from "@ckb-lumos/bi";
import { sudt } from "@ckb-lumos/common-scripts";
import { parseAddress } from "@ckb-lumos/helpers";
import { Address, commons, helpers, Script } from "@ckb-lumos/lumos";
import { readBigUInt128LE } from "@lay2/pw-core";

import { CkbClient } from "./ckb_client";
import { CkbAccount } from "./ckb_account";
import { ScriptType } from "./types";
import { calcFromInfos } from "./utils";

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
    fee?: BIish
  ): Promise<string> {
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.ckbClient.indexer,
    });

    const config = this.ckbClient.config;
    for (var [toAddress, amount] of to) {
      txSkeleton = await commons.common.transfer(
        txSkeleton,
        calcFromInfos(from),
        toAddress,
        amount,
        undefined,
        undefined,
        { config }
      );
    }

    return await this.ckbClient.submitTransaction(txSkeleton, from, fee);
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
    fee?: BIish
  ): Promise<string> {
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.ckbClient.indexer,
    });

    const config = this.ckbClient.config;
    for (var [toAddress, amount] of to) {
      txSkeleton = await sudt.transfer(
        txSkeleton,
        calcFromInfos(from),
        sudtToken,
        toAddress,
        amount,
        undefined,
        undefined,
        undefined,
        { config }
      );
    }

    return await this.ckbClient.submitTransaction(txSkeleton, from, fee);
  }

  public async getCkbBalance(
    address: string,
    lockOnly: boolean = true
  ): Promise<bigint> {
    const lock = parseAddress(address, { config: this.ckbClient.config });
    const searchKey = {
      script: lock,
      script_type: ScriptType.lock,
    };
    let cells = (await this.ckbClient.indexer.getCells(searchKey)).objects;
    if (lockOnly) {
      cells = cells.filter((cell) => !cell.cell_output.type);
    }
    const balance = cells
      .map((cell) => BigInt(cell.cell_output.capacity))
      .reduce((p, c) => p + c, 0n);
    return balance;
  }

  public async getSudtBalance(address: string, udt: Script): Promise<bigint> {
    const lock = parseAddress(address, { config: this.ckbClient.config });
    const searchKey = {
      script: lock,
      script_type: ScriptType.lock,
      filter: {
        script: udt,
      },
    };
    const cells = (await this.ckbClient.indexer.getCells(searchKey)).objects;
    const balance = cells
      .map((cell) => this.getSUDTAmount(cell.data))
      .reduce((p, c) => p + c, 0n);
    return balance;
  }

  getSUDTAmount(cellData: string): bigint {
    const sudtAmountData = cellData.slice(0, 34);
    return BigInt(readBigUInt128LE(sudtAmountData).toString());
  }

  public async issueToken(
    from: CkbAccount,
    amount: BIish,
    fee?: BIish
  ): Promise<string> {
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.ckbClient.indexer,
    });

    txSkeleton = await sudt.issueToken(
      txSkeleton,
      calcFromInfos(from)[0],
      amount,
      undefined,
      undefined,
      { config: this.ckbClient.config }
    );

    return await this.ckbClient.submitTransaction(txSkeleton, from, fee);
  }

  public calcToken(from: CkbAccount): string {
    return this.calcSudtScript(from).args;
  }

  public calcSudtScript(from: CkbAccount): Script {
    const template = this.ckbClient.config.SCRIPTS.SUDT;
    if (!template) {
      throw new Error("Provided config does not have SUDT script setup!");
    }
    return {
      code_hash: template.CODE_HASH,
      hash_type: template.HASH_TYPE,
      args: utils.computeScriptHash(from.lockScript),
    };
  }
}
