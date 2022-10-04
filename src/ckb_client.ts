import { BIish } from "@ckb-lumos/bi";
import { TransactionWithStatus } from "@ckb-lumos/base";
import {
  OutPoint,
  Cell,
  commons,
  hd,
  Indexer,
  RPC,
  Transaction,
} from "@ckb-lumos/lumos";
import { predefined, Config } from "@ckb-lumos/config-manager";
import { serializeMultisigScript } from "@ckb-lumos/common-scripts/lib/from_info";
import { prepareSigningEntries } from "@ckb-lumos/common-scripts/lib/helper";
import { sealTransaction, TransactionSkeletonType } from "@ckb-lumos/helpers";

import { CkbAccount, MultisigAccount, NormalAccount } from "./ckb_account";
import { asyncSleep, calcFromInfos } from "./utils";
import { Net } from "./types";

const feeRate = 1000;

export class CkbClient {
  public rpc: RPC;
  public indexer: InstanceType<typeof Indexer>;
  public config: Config;
  public netType: Net;

  constructor(ckbRpcUrl: string, ckbIndexerUrl: string) {
    if (!ckbRpcUrl) {
      throw new Error("PRC URL cannot be empty.");
    }
    if (!ckbIndexerUrl) {
      throw new Error("Indexer URL cannot be empty.");
    }

    if (ckbRpcUrl.includes("main")) {
      this.config = predefined.LINA;
      this.netType = Net.MAINNET;
    } else {
      this.config = predefined.AGGRON4;
      this.netType = ckbRpcUrl.includes("test") ? Net.TESTNET : Net.DEVNET;
    }
    this.rpc = new RPC(ckbRpcUrl);
    this.indexer = new Indexer(ckbRpcUrl, ckbIndexerUrl);
  }

  public async submitTransaction(
    txSkeleton: TransactionSkeletonType,
    from: CkbAccount,
    fee?: BIish
  ): Promise<string> {
    txSkeleton = await this.payFee(txSkeleton, from, fee);
    const sealedTx = await this.signTransaction(txSkeleton, from);
    return await this.sendTransaction(sealedTx);
  }

  /**
   * @returns The transaction hash.
   */
  public async sendTransaction(sealedTx: Transaction): Promise<string> {
    return await this.rpc.send_transaction(sealedTx);
  }

  public async getTransaction(
    txHash: string
  ): Promise<TransactionWithStatus | null> {
    return await this.rpc.get_transaction(txHash);
  }

  public async waitForTransaction(
    txHash: string,
    options: { pollIntervalMs?: number; timeoutMs?: number } = {}
  ): Promise<Transaction | null> {
    const { pollIntervalMs = 1000, timeoutMs = 120000 } = options;
    const start = Date.now();

    let result: Transaction | null = null;

    while (Date.now() - start <= timeoutMs) {
      const tx = await this.rpc.get_transaction(txHash);
      if (tx?.tx_status?.status === "committed") {
        result = tx.transaction;
        break;
      }

      await asyncSleep(pollIntervalMs);
    }

    const rpcTip = Number(await this.rpc.get_tip_block_number());

    while (Date.now() - start <= timeoutMs) {
      const tip = await this.rpc.get_tip_header();
      if (Number(tip.number) >= rpcTip) break;

      await asyncSleep(pollIntervalMs);
    }

    return result;
  }

  public async payFee(
    txSkeleton: TransactionSkeletonType,
    from: CkbAccount,
    fee?: BIish
  ): Promise<TransactionSkeletonType> {
    const config = this.config;
    if (fee) {
      txSkeleton = await commons.common.payFee(
        txSkeleton,
        calcFromInfos(from),
        fee,
        undefined,
        { config }
      );
    } else {
      txSkeleton = await commons.common.payFeeByFeeRate(
        txSkeleton,
        calcFromInfos(from),
        feeRate,
        undefined,
        { config }
      );
    }
    return txSkeleton;
  }

  public async signTransaction(
    txSkeleton: TransactionSkeletonType,
    from: CkbAccount
  ): Promise<Transaction> {
    let signatures;
    if (from instanceof MultisigAccount) {
      txSkeleton = prepareSigningEntries(
        txSkeleton,
        this.config,
        "SECP256K1_BLAKE160_MULTISIG"
      );

      const fromAccount: MultisigAccount = from;
      const message = txSkeleton.get("signingEntries").get(0)?.message;

      let sigs: string = "";
      fromAccount.privateKeys.forEach((privKey) => {
        if (privKey !== "") {
          let sig = hd.key.signRecoverable(message!, privKey);
          sig = sig.slice(2);
          sigs += sig;
        }
      });

      signatures = [serializeMultisigScript(fromAccount.multiSigScript) + sigs];
    } else {
      txSkeleton = prepareSigningEntries(
        txSkeleton,
        this.config,
        "SECP256K1_BLAKE160"
      );

      const fromAccount: NormalAccount = from;
      signatures = txSkeleton
        .get("signingEntries")
        .map((entry) =>
          hd.key.signRecoverable(entry.message, fromAccount.privateKey)
        )
        .toArray();
    }
    return sealTransaction(txSkeleton, signatures);
  }

  public async getCellByOutPoint(outpoint: OutPoint): Promise<Cell> {
    const tx = await this.rpc.get_transaction(outpoint.tx_hash);
    if (!tx) {
      throw new Error(`not found tx: ${outpoint.tx_hash}`);
    }

    const block = await this.rpc.get_block(tx.tx_status.block_hash!);
    const index = Number(outpoint.index);
    return {
      cell_output: tx.transaction.outputs[index],
      data: tx.transaction.outputs_data[index],
      out_point: outpoint,
      block_hash: tx.tx_status.block_hash,
      block_number: block!.header.number,
    };
  }
}
