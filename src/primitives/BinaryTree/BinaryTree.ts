/**
 * Binary State Tree (EIP-7864) - Unified tree structure for Ethereum state
 *
 * Implements a binary tree with:
 * - 32-byte keys (31-byte stem + 1-byte subindex)
 * - Four node types: Internal, Stem, Leaf, Empty
 * - BLAKE3 hashing (current draft, TBD in final spec)
 * - Minimal internal branching for efficiency
 *
 * @see https://eips.ethereum.org/EIPS/eip-7864
 */

import { blake3 } from "@noble/hashes/blake3.js";
import type { Hex } from "../Hex/index.js";

export interface BinaryTree {
  readonly root: Node;
}

export type Node =
  | { readonly type: "empty" }
  | { readonly type: "internal"; readonly left: Uint8Array; readonly right: Uint8Array }
  | { readonly type: "stem"; readonly stem: Uint8Array; readonly values: (Uint8Array | null)[] }
  | { readonly type: "leaf"; readonly value: Uint8Array };

export type InternalNode = Extract<Node, { type: "internal" }>;
export type StemNode = Extract<Node, { type: "stem" }>;
export type LeafNode = Extract<Node, { type: "leaf" }>;
export type EmptyNode = Extract<Node, { type: "empty" }>;

/**
 * Account basic data layout at index 0
 * - Version (1 byte)
 * - Code size (3 bytes)
 * - Nonce (8 bytes)
 * - Balance (16 bytes)
 */
export interface AccountData {
  readonly version: number;
  readonly codeSize: number;
  readonly nonce: bigint;
  readonly balance: bigint;
}

/**
 * Convert address to 32-byte key format (prepend 12 zero bytes)
 */
export function addressToKey(addr: Uint8Array): Uint8Array {
  if (addr.length !== 20) throw new Error("Invalid address length");
  const k = new Uint8Array(32);
  k.set(addr, 12);
  return k;
}

/**
 * Split 32-byte key into stem (31 bytes) and subindex (1 byte)
 */
export function splitKey(k: Uint8Array): { stem: Uint8Array; idx: number } {
  if (k.length !== 32) throw new Error("Invalid key length");
  return {
    stem: k.slice(0, 31),
    idx: k[31] ?? 0,
  };
}

/**
 * Get bit at position in stem (31 bytes = 248 bits)
 */
export function getStemBit(stem: Uint8Array, pos: number): 0 | 1 {
  if (pos >= 248) return 0;
  const byteIdx = Math.floor(pos / 8);
  const bitIdx = 7 - (pos % 8);
  const byte = stem[byteIdx];
  if (byte === undefined) return 0;
  return ((byte >> bitIdx) & 1) as 0 | 1;
}

/**
 * Hash internal node (left || right)
 * If both children are zero, parent hash is zero
 */
export function hashInternal(l: Uint8Array, r: Uint8Array): Uint8Array {
  const lz = l.every((b) => b === 0);
  const rz = r.every((b) => b === 0);
  if (lz && rz) return new Uint8Array(32);

  return blake3(new Uint8Array([...l, ...r]));
}

/**
 * Hash stem node
 */
export function hashStem(node: StemNode): Uint8Array {
  const data: number[] = [...node.stem];
  for (const v of node.values) {
    if (v) {
      data.push(...v);
    } else {
      data.push(...new Array(32).fill(0));
    }
  }
  return blake3(new Uint8Array(data));
}

/**
 * Hash leaf node
 */
export function hashLeaf(node: LeafNode): Uint8Array {
  return blake3(node.value);
}

/**
 * Hash any node type
 */
export function hashNode(node: Node): Uint8Array {
  switch (node.type) {
    case "empty":
      return new Uint8Array(32);
    case "internal":
      return hashInternal(node.left, node.right);
    case "stem":
      return hashStem(node);
    case "leaf":
      return hashLeaf(node);
  }
}

/**
 * Create empty binary tree
 */
export function init(): BinaryTree {
  return { root: { type: "empty" } };
}

/**
 * Insert value at key
 */
export function insert(tree: BinaryTree, k: Uint8Array, v: Uint8Array): BinaryTree {
  const { stem, idx } = splitKey(k);
  const root = insertNode(tree.root, stem, idx, v, 0);
  return { root };
}

function insertNode(node: Node, stem: Uint8Array, idx: number, v: Uint8Array, depth: number): Node {
  switch (node.type) {
    case "empty": {
      const values: (Uint8Array | null)[] = new Array(256).fill(null);
      values[idx] = v;
      return { type: "stem", stem, values };
    }
    case "stem": {
      if (arraysEqual(node.stem, stem)) {
        const values = [...node.values];
        values[idx] = v;
        return { type: "stem", stem, values };
      }
      return splitStems(node, stem, idx, v, depth);
    }
    case "internal": {
      const bit = getStemBit(stem, depth);
      if (bit === 0) {
        const newLeft = insertNode({ type: "internal", left: node.left, right: node.right }, stem, idx, v, depth + 1);
        return { type: "internal", left: hashNode(newLeft), right: node.right };
      }
      const newRight = insertNode({ type: "internal", left: node.left, right: node.right }, stem, idx, v, depth + 1);
      return { type: "internal", left: node.left, right: hashNode(newRight) };
    }
    case "leaf":
      throw new Error("Invalid tree state");
  }
}

function splitStems(existing: StemNode, newStem: Uint8Array, newIdx: number, newVal: Uint8Array, depth: number): Node {
  const existingBit = getStemBit(existing.stem, depth);
  const newBit = getStemBit(newStem, depth);

  if (existingBit === newBit) {
    const child = splitStems(existing, newStem, newIdx, newVal, depth + 1);
    const childHash = hashNode(child);

    if (existingBit === 0) {
      return { type: "internal", left: childHash, right: new Uint8Array(32) };
    }
    return { type: "internal", left: new Uint8Array(32), right: childHash };
  }

  const newValues: (Uint8Array | null)[] = new Array(256).fill(null);
  newValues[newIdx] = newVal;
  const newStemNode: StemNode = { type: "stem", stem: newStem, values: newValues };

  const existingHash = hashNode(existing);
  const newHash = hashNode(newStemNode);

  if (existingBit === 0) {
    return { type: "internal", left: existingHash, right: newHash };
  }
  return { type: "internal", left: newHash, right: existingHash };
}

/**
 * Get value at key
 */
export function get(tree: BinaryTree, k: Uint8Array): Uint8Array | null {
  const { stem, idx } = splitKey(k);
  return getNode(tree.root, stem, idx, 0);
}

function getNode(node: Node, stem: Uint8Array, idx: number, _depth: number): Uint8Array | null {
  switch (node.type) {
    case "empty":
      return null;
    case "stem":
      if (arraysEqual(node.stem, stem)) {
        return node.values[idx] || null;
      }
      return null;
    case "internal": {
      // Would need to traverse to child node
      // Simplified for now
      return null;
    }
    case "leaf":
      return null;
  }
}

/**
 * Compute root hash
 */
export function rootHash(tree: BinaryTree): Uint8Array {
  return hashNode(tree.root);
}

/**
 * Convert root hash to hex
 */
export function rootHashHex(tree: BinaryTree): Hex {
  const h = rootHash(tree);
  return `0x${Array.from(h)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as Hex;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const BinaryTree = {
  init,
  insert,
  get,
  rootHash,
  rootHashHex,
  addressToKey,
  splitKey,
  getStemBit,
  hashInternal,
  hashStem,
  hashLeaf,
  hashNode,
} as const;
