import { BIish } from "@ckb-lumos/bi";
import { TransactionWithStatus } from "@ckb-lumos/base"
import { commons, hd, Indexer, RPC, Transaction } from "@ckb-lumos/lumos";
import { predefined, Config } from "@ckb-lumos/config-manager";
import { serializeMultisigScript } from '@ckb-lumos/common-scripts/lib/from_info';
import { prepareSigningEntries } from "@ckb-lumos/common-scripts/lib/helper";
import { sealTransaction, TransactionSkeletonType } from "@ckb-lumos/helpers";

import { CkbAccount, MultisigAccount, NormalAccount } from "./ckb_account";
import { asyncSleep, calcFromInfos } from './utils';

export class CkbClient {
  public rpc: RPC;
  public indexer: InstanceType<typeof Indexer>;
  public netConfig: Config;

  constructor(ckbRpcUrl: string, ckbIndexerUrl: string) {
    if (!ckbRpcUrl) {
      throw new Error("PRC URL cannot be empty.");
    }
    if (!ckbIndexerUrl) {
      throw new Error("Indexer URL cannot be empty.");
    }

    this.netConfig = ckbRpcUrl.includes("main") ? predefined.LINA: predefined.AGGRON4;
    this.rpc = new RPC(ckbRpcUrl);
    this.indexer = new Indexer(ckbRpcUrl, ckbIndexerUrl);
  }

  /**
   * @returns The transaction hash.
   */
  public async submitTransaction(sealedTx: Transaction): Promise<string> {
    return await this.rpc.send_transaction(sealedTx);
  }

  public async getTransaction(txHash: string): Promise<TransactionWithStatus | null> {
    return await this.rpc.get_transaction(txHash);
  }

  public async waitForTransaction(
    txHash: string,
    options: { pollIntervalMs?: number; timeoutMs?: number } = {},
  ): Promise<Transaction | null> {
    const { pollIntervalMs = 1000, timeoutMs = 120000 } = options;
    const start = Date.now();

    let result: Transaction | null = null;

    while (Date.now() - start <= timeoutMs) {
      const tx = await this.rpc.get_transaction(txHash);
      if (tx?.tx_status?.status === 'committed') {
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

  public async payFee(txSkeleton: TransactionSkeletonType, from: CkbAccount, fee?: BIish): Promise<TransactionSkeletonType> {
    const config = this.netConfig;
    if (fee) {
      txSkeleton = await commons.common.payFee(
        txSkeleton,
        calcFromInfos(from),
        fee,
        undefined,
        { config },
      )
    } else {
      txSkeleton = await commons.common.payFeeByFeeRate(
        txSkeleton,
        calcFromInfos(from),
        1000,
        undefined,
        { config },
      )
    }
    return txSkeleton;
  }

  public async signTransaction(txSkeleton: TransactionSkeletonType, from: CkbAccount): Promise<Transaction> {
    let signatures;
    if (from instanceof MultisigAccount) {
      txSkeleton = prepareSigningEntries(txSkeleton, this.netConfig, "SECP256K1_BLAKE160_MULTISIG");

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
      txSkeleton = prepareSigningEntries(txSkeleton, this.netConfig, "SECP256K1_BLAKE160");

      const fromAccount: NormalAccount = from;
      signatures = txSkeleton
        .get("signingEntries")
        .map((entry) => hd.key.signRecoverable(entry.message, fromAccount.privateKey))
        .toArray();
    }
    return sealTransaction(txSkeleton, signatures);
  }
};
