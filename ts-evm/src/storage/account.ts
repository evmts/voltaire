import type { Word } from '../types';
import type { Address } from '../types_blockchain';
import * as crypto from 'crypto';

export interface Account {
  balance: Word;
  nonce: bigint;
  storageRoot: Uint8Array; // 32 bytes
  codeHash: Uint8Array; // 32 bytes
}

export const EMPTY_CODE_HASH = new Uint8Array(32).fill(0xc5).fill(0xd2, 1).fill(0x46, 2).fill(0x01, 3).fill(0x86, 4).fill(0xf7, 5).fill(0x23, 6).fill(0x3c, 7).fill(0x92, 8).fill(0x7e, 9).fill(0x7d, 10).fill(0xb2, 11).fill(0xdc, 12).fill(0xc7, 13).fill(0x03, 14).fill(0xc0, 15).fill(0xe5, 16).fill(0x00, 17).fill(0xb6, 18).fill(0x53, 19).fill(0xca, 20).fill(0x82, 21).fill(0x27, 22).fill(0x3b, 23).fill(0x7b, 24).fill(0xfa, 25).fill(0xd8, 26).fill(0x04, 27).fill(0x5d, 28).fill(0x85, 29).fill(0xa4, 30).fill(0x70, 31);
export const EMPTY_STORAGE_ROOT = new Uint8Array(32).fill(0x56).fill(0xe8, 1).fill(0x1f, 2).fill(0x17, 3).fill(0x1b, 4).fill(0xcc, 5).fill(0x55, 6).fill(0xa6, 7).fill(0xff, 8).fill(0x83, 9).fill(0x45, 10).fill(0xe6, 11).fill(0x92, 12).fill(0xc0, 13).fill(0xf8, 14).fill(0x6e, 15).fill(0x5b, 16).fill(0x48, 17).fill(0xe0, 18).fill(0x1b, 19).fill(0x99, 20).fill(0x6c, 21).fill(0xad, 22).fill(0xc0, 23).fill(0x01, 24).fill(0x62, 25).fill(0x2f, 26).fill(0xb5, 27).fill(0xe3, 28).fill(0x63, 29).fill(0xb4, 30).fill(0x21, 31);

export function createEmptyAccount(): Account {
  return {
    balance: 0n,
    nonce: 0n,
    storageRoot: EMPTY_STORAGE_ROOT,
    codeHash: EMPTY_CODE_HASH
  };
}

export function isContract(account: Account): boolean {
  return !account.codeHash.every((b, i) => b === EMPTY_CODE_HASH[i]);
}

export function hashCode(code: Uint8Array): Uint8Array {
  if (code.length === 0) return EMPTY_CODE_HASH;
  // Using SHA256 as placeholder for Keccak256
  const hash = crypto.createHash('sha256');
  hash.update(code);
  return new Uint8Array(hash.digest());
}