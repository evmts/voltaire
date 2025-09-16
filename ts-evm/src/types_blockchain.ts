import { Word } from './types';

// 20-byte Ethereum address
export type Address = Uint8Array; // Always 20 bytes

export function createAddress(bytes?: Uint8Array): Address {
  const addr = new Uint8Array(20);
  if (bytes) {
    addr.set(bytes.subarray(0, Math.min(20, bytes.length)));
  }
  return addr;
}

export function addressToWord(addr: Address): Word {
  let word = 0n;
  for (let i = 0; i < 20; i++) {
    word = (word << 8n) | BigInt(addr[i]);
  }
  return word;
}

export function wordToAddress(word: Word): Address {
  const addr = new Uint8Array(20);
  let w = word;
  for (let i = 19; i >= 0; i--) {
    addr[i] = Number(w & 0xffn);
    w >>= 8n;
  }
  return addr;
}

export interface BlockInfo {
  number: Word;
  timestamp: Word;
  gasLimit: Word;
  difficulty: Word;  // PREVRANDAO post-merge
  baseFee: Word;
  coinbase: Address;
  blobBaseFee?: Word;
  blobVersionedHashes?: Word[];
}

export interface TransactionContext {
  origin: Address;
  gasPrice: Word;
}