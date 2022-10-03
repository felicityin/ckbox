import { PackedSince } from "@ckb-lumos/base";
import { MultisigScript, parseFromInfo } from "@ckb-lumos/common-scripts";
import { predefined } from "@ckb-lumos/config-manager";
import { privateKeyToBlake160 } from "@ckb-lumos/hd/lib/key";
import { encodeToAddress, generateSecp256k1Blake160Address, parseAddress } from "@ckb-lumos/helpers";
import { HexString, Script } from "@ckb-lumos/lumos";

import { Net } from "./types";

export type CkbAccount = NormalAccount | MultisigAccount;

export class NormalAccount {
  public privateKey: HexString;
  public address: string;
  public lockScript: Script;

  constructor(privateKey: string, net: Net = Net.TESTNET) {
    this.privateKey = privateKey;

    const args = privateKeyToBlake160(privateKey);
    const config = net == Net.TESTNET ? predefined.AGGRON4 : predefined.LINA;
    const shortAddress = generateSecp256k1Blake160Address(args, { config });
    this.lockScript = parseAddress(shortAddress, { config });
    this.address = encodeToAddress(this.lockScript, { config });
  }
}

export class MultisigAccount {
  public privateKeys: HexString[];
  public address: string;
  public lockScript: Script;
  public multiSigScript: MultisigScript;

  /**
   * @param privateKeys
   * @param R The provided signatures must match at least the first R items of the Pubkey list.
   * @param M M of N signatures must be provided to unlock the cell. N equals to the size of privateKeys.
   * @param net
   * @param since locktime in since format
   * @param net 
   * 
   * R, M are single byte unsigned integers that ranges from 0 to 255.
   * R must no more than M.
   */
  constructor(privateKeys: HexString[], R: number, M: number, net: Net = Net.TESTNET, since?: PackedSince) {
    this.privateKeys = privateKeys;

    const config = net == Net.TESTNET ? predefined.AGGRON4 : predefined.LINA;
    const publicKeyHashes = privateKeys.map((key) => privateKeyToBlake160(key));
    this.multiSigScript = { R, M, publicKeyHashes, since };

    const { fromScript } = parseFromInfo(this.multiSigScript);
    this.lockScript = fromScript;

    this.address = encodeToAddress(this.lockScript, { config });
  }
}

export function scriptToAddress(script: Script): String {
  return encodeToAddress(script);
}

export function addressToScript(address: string): Script {
  return parseAddress(address);
}
