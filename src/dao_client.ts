import { BIish } from "@ckb-lumos/bi";
import { commons, helpers, OutPoint } from "@ckb-lumos/lumos";

import { CkbClient } from "./ckb_client";
import { CkbAccount } from "./ckb_account";
import { calcFromInfos } from "./utils";

export class DaoClient {
  ckbClient: CkbClient;

  constructor(ckbClient: CkbClient) {
    this.ckbClient = ckbClient;
  }

  public async deposit(
    from: CkbAccount,
    to: string,
    amount: BIish,
    fee?: BIish
  ): Promise<string> {
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.ckbClient.indexer,
    });

    txSkeleton = await commons.dao.deposit(
      txSkeleton,
      calcFromInfos(from)[0],
      to,
      amount,
      { config: this.ckbClient.config }
    );

    return await this.ckbClient.submitTransaction(txSkeleton, from, fee);
  }

  public async withdraw(
    from: CkbAccount,
    depositOutpoint: OutPoint,
    fee?: BIish
  ) {
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.ckbClient.indexer,
    });

    const depositCell = await this.ckbClient.getCellByOutPoint(depositOutpoint);

    txSkeleton = await commons.dao.withdraw(
      txSkeleton,
      depositCell,
      calcFromInfos(from)[0],
      { config: this.ckbClient.config }
    );

    return await this.ckbClient.submitTransaction(txSkeleton, from, fee);
  }

  public async unlock(
    from: CkbAccount,
    to: string,
    depositOutpoint: OutPoint,
    withdrawOutpoint: OutPoint,
    fee?: BIish
  ) {
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.ckbClient.indexer,
    });

    const depositCell = await this.ckbClient.getCellByOutPoint(depositOutpoint);
    const withdrawCell = await this.ckbClient.getCellByOutPoint(
      withdrawOutpoint
    );

    txSkeleton = await commons.dao.unlock(
      txSkeleton,
      depositCell,
      withdrawCell,
      to,
      calcFromInfos(from)[0],
      { config: this.ckbClient.config }
    );

    return await this.ckbClient.submitTransaction(txSkeleton, from, fee);
  }
}

export default {
  DaoClient,
};
