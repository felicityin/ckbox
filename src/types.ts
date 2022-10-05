export type HexNumber = string;

export enum Net {
  DEVNET = 0,
  TESTNET = 1,
  MAINNET = 2,
}

export enum ScriptType {
  type = "type",
  lock = "lock",
}

export interface ScriptConfig {
  CODE_HASH: string;
  HASH_TYPE: "type" | "data";
  TX_HASH: string;
  INDEX: string;
  DEP_TYPE: "dep_group" | "code";
  SHORT_ID?: number;
}

export default {
  Net,
  ScriptType,
};
