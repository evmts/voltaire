import type { Frame } from '../frame/frame';
import { ErrorUnion, createError } from '../errors';
import type { DispatchItem } from '../preprocessor/dispatch';
import * as crypto from 'crypto';

// Keccak256 hashing operation

// Gas costs
const KECCAK_GAS_COSTS = {
  BASE: 30,
  PER_WORD: 6 // per 32 bytes
} as const;

// KECCAK256 (0x20) - Compute Keccak-256 hash
export function keccak256(frame: Frame, _cursor: DispatchItem[]): ErrorUnion | null {
  if (frame.stack.size() < 2) {
    return createError('StackUnderflow', 'KECCAK256 requires 2 stack items');
  }
  
  const offset = frame.stack.pop();
  const size = frame.stack.pop();
  
  // Calculate gas cost
  const wordCount = (BigInt(size) + 31n) / 32n; // Round up to word size
  const gasCost = BigInt(KECCAK_GAS_COSTS.BASE) + wordCount * BigInt(KECCAK_GAS_COSTS.PER_WORD);
  
  if (frame.gasRemaining < gasCost) {
    return createError('OutOfGas', `KECCAK256 requires ${gasCost} gas`);
  }
  frame.gasRemaining -= gasCost;
  
  // Get data from memory
  const data = frame.memory.readSlice(Number(offset), Number(size));
  if (data instanceof Error) {
    return createError('MemoryError', data.message);
  }
  
  // Compute hash
  const hash = computeKeccak256(data);
  
  // Convert hash to Word (bigint)
  let hashWord = 0n;
  for (let i = 0; i < 32; i++) {
    hashWord = (hashWord << 8n) | BigInt(hash[i]);
  }
  
  // Push result to stack
  const result = frame.stack.push(hashWord);
  if (result instanceof Error) {
    return createError('StackOverflow', 'KECCAK256 would exceed stack limit');
  }
  
  return null;
}

// Compute Keccak-256 hash
function computeKeccak256(data: Uint8Array): Uint8Array {
  // NOTE: This is using SHA-256 as a placeholder
  // In production, you would use a proper Keccak-256 implementation
  // such as js-sha3 or ethereum-cryptography
  
  // For now, using SHA-256 as placeholder (NOT CORRECT FOR PRODUCTION)
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}

// Alternative: If using a proper Keccak library
// import { keccak256 as keccak } from 'js-sha3';
// function computeKeccak256(data: Uint8Array): Uint8Array {
//   return new Uint8Array(Buffer.from(keccak(data), 'hex'));
// }

// Helper function to compute contract address from CREATE
export function computeCreateAddress(deployer: bigint, nonce: bigint): bigint {
  // RLP encode [deployer, nonce]
  const rlpEncoded = rlpEncode([addressToBytes(deployer), bigintToBytes(nonce)]);
  
  // Hash and take last 20 bytes
  const hash = computeKeccak256(rlpEncoded);
  
  // Convert last 20 bytes to address
  let address = 0n;
  for (let i = 12; i < 32; i++) {
    address = (address << 8n) | BigInt(hash[i]);
  }
  
  return address;
}

// Helper function to compute contract address from CREATE2
export function computeCreate2Address(deployer: bigint, salt: bigint, initCodeHash: Uint8Array): bigint {
  // Compute as: keccak256(0xff ++ deployer ++ salt ++ keccak256(init_code))[12:]
  const buffer = new Uint8Array(1 + 20 + 32 + 32);
  
  // 0xff prefix
  buffer[0] = 0xff;
  
  // Deployer address (20 bytes)
  const deployerBytes = addressToBytes(deployer);
  buffer.set(deployerBytes, 1);
  
  // Salt (32 bytes)
  const saltBytes = wordToBytes(salt);
  buffer.set(saltBytes, 21);
  
  // Init code hash (32 bytes)
  buffer.set(initCodeHash, 53);
  
  // Hash and take last 20 bytes
  const hash = computeKeccak256(buffer);
  
  // Convert last 20 bytes to address
  let address = 0n;
  for (let i = 12; i < 32; i++) {
    address = (address << 8n) | BigInt(hash[i]);
  }
  
  return address;
}

// Helper functions for encoding

function addressToBytes(address: bigint): Uint8Array {
  const bytes = new Uint8Array(20);
  let addr = address;
  for (let i = 19; i >= 0; i--) {
    bytes[i] = Number(addr & 0xFFn);
    addr >>= 8n;
  }
  return bytes;
}

function wordToBytes(word: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let w = word;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(w & 0xFFn);
    w >>= 8n;
  }
  return bytes;
}

function bigintToBytes(value: bigint): Uint8Array {
  if (value === 0n) return new Uint8Array([0]);
  
  const bytes: number[] = [];
  let v = value;
  while (v > 0n) {
    bytes.unshift(Number(v & 0xFFn));
    v >>= 8n;
  }
  return new Uint8Array(bytes);
}

// Simplified RLP encoding (for address computation)
function rlpEncode(items: Uint8Array[]): Uint8Array {
  const encodedItems: Uint8Array[] = [];
  
  for (const item of items) {
    if (item.length === 1 && item[0] < 0x80) {
      // Single byte less than 0x80 - encode as is
      encodedItems.push(item);
    } else if (item.length <= 55) {
      // Short string
      const encoded = new Uint8Array(item.length + 1);
      encoded[0] = 0x80 + item.length;
      encoded.set(item, 1);
      encodedItems.push(encoded);
    } else {
      // Long string
      const lengthBytes = bigintToBytes(BigInt(item.length));
      const encoded = new Uint8Array(1 + lengthBytes.length + item.length);
      encoded[0] = 0xb7 + lengthBytes.length;
      encoded.set(lengthBytes, 1);
      encoded.set(item, 1 + lengthBytes.length);
      encodedItems.push(encoded);
    }
  }
  
  // Calculate total length
  const totalLength = encodedItems.reduce((sum, item) => sum + item.length, 0);
  
  // Encode list
  if (totalLength <= 55) {
    // Short list
    const result = new Uint8Array(totalLength + 1);
    result[0] = 0xc0 + totalLength;
    let offset = 1;
    for (const item of encodedItems) {
      result.set(item, offset);
      offset += item.length;
    }
    return result;
  } else {
    // Long list
    const lengthBytes = bigintToBytes(BigInt(totalLength));
    const result = new Uint8Array(1 + lengthBytes.length + totalLength);
    result[0] = 0xf7 + lengthBytes.length;
    result.set(lengthBytes, 1);
    let offset = 1 + lengthBytes.length;
    for (const item of encodedItems) {
      result.set(item, offset);
      offset += item.length;
    }
    return result;
  }
}

// Export utilities for use in other modules
export const keccakUtils = {
  computeKeccak256,
  computeCreateAddress,
  computeCreate2Address,
  addressToBytes,
  wordToBytes,
  rlpEncode
};