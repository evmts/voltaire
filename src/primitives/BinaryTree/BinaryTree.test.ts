import { describe, expect, test } from "vitest";
import * as BinaryTree from "./BinaryTree.js";

describe("BinaryTree", () => {
  describe("addressToKey", () => {
    test("converts 20-byte address to 32-byte key", () => {
      const addr = new Uint8Array(20);
      addr[0] = 0xf3;
      addr[1] = 0x9f;

      const k = BinaryTree.addressToKey(addr);

      expect(k.length).toBe(32);
      expect(k[0]).toBe(0);
      expect(k[11]).toBe(0);
      expect(k[12]).toBe(0xf3);
      expect(k[13]).toBe(0x9f);
    });

    test("throws on invalid address length", () => {
      const addr = new Uint8Array(19);
      expect(() => BinaryTree.addressToKey(addr)).toThrow("Invalid address length");
    });
  });

  describe("splitKey", () => {
    test("splits 32-byte key into stem and subindex", () => {
      const k = new Uint8Array(32);
      k.fill(0xaa);
      k[31] = 0x42;

      const { stem, idx } = BinaryTree.splitKey(k);

      expect(idx).toBe(0x42);
      expect(stem.length).toBe(31);
      expect(stem[0]).toBe(0xaa);
      expect(stem[30]).toBe(0xaa);
    });

    test("throws on invalid key length", () => {
      const k = new Uint8Array(31);
      expect(() => BinaryTree.splitKey(k)).toThrow("Invalid key length");
    });
  });

  describe("getStemBit", () => {
    test("extracts bit at position", () => {
      const stem = new Uint8Array(31);
      stem[0] = 0b10101010;

      expect(BinaryTree.getStemBit(stem, 0)).toBe(1);
      expect(BinaryTree.getStemBit(stem, 1)).toBe(0);
      expect(BinaryTree.getStemBit(stem, 2)).toBe(1);
      expect(BinaryTree.getStemBit(stem, 3)).toBe(0);
      expect(BinaryTree.getStemBit(stem, 4)).toBe(1);
      expect(BinaryTree.getStemBit(stem, 5)).toBe(0);
      expect(BinaryTree.getStemBit(stem, 6)).toBe(1);
      expect(BinaryTree.getStemBit(stem, 7)).toBe(0);
    });

    test("returns 0 for position >= 248", () => {
      const stem = new Uint8Array(31);
      stem.fill(0xff);
      expect(BinaryTree.getStemBit(stem, 248)).toBe(0);
      expect(BinaryTree.getStemBit(stem, 300)).toBe(0);
    });
  });

  describe("hashInternal", () => {
    test("returns zero hash when both children are zero", () => {
      const zero = new Uint8Array(32);
      const h = BinaryTree.hashInternal(zero, zero);

      expect(h.length).toBe(32);
      expect(h.every((b) => b === 0)).toBe(true);
    });

    test("returns non-zero hash for non-zero children", () => {
      const l = new Uint8Array(32);
      l[0] = 0x01;
      const r = new Uint8Array(32);
      r[0] = 0x02;

      const h = BinaryTree.hashInternal(l, r);

      expect(h.length).toBe(32);
      expect(h.some((b) => b !== 0)).toBe(true);
    });
  });

  describe("init", () => {
    test("creates empty tree", () => {
      const tree = BinaryTree.init();

      expect(tree.root.type).toBe("empty");
    });

    test("empty tree has zero root hash", () => {
      const tree = BinaryTree.init();
      const h = BinaryTree.rootHash(tree);

      expect(h.length).toBe(32);
      expect(h.every((b) => b === 0)).toBe(true);
    });
  });

  describe("insert", () => {
    test("inserts single value", () => {
      let tree = BinaryTree.init();

      const k = new Uint8Array(32);
      k[31] = 5;
      const v = new Uint8Array(32);
      v[31] = 0x42;

      tree = BinaryTree.insert(tree, k, v);

      const h = BinaryTree.rootHash(tree);
      expect(h.some((b) => b !== 0)).toBe(true);
    });

    test("inserts and retrieves value", () => {
      let tree = BinaryTree.init();

      const k = new Uint8Array(32);
      k[31] = 10;
      const v = new Uint8Array(32);
      v[31] = 0x99;

      tree = BinaryTree.insert(tree, k, v);

      const retrieved = BinaryTree.get(tree, k);
      expect(retrieved).not.toBeNull();
      expect(retrieved![31]).toBe(0x99);
    });

    test("inserts multiple values", () => {
      let tree = BinaryTree.init();

      for (let i = 0; i < 5; i++) {
        const k = new Uint8Array(32);
        k[31] = i;
        const v = new Uint8Array(32);
        v[31] = i * 2;

        tree = BinaryTree.insert(tree, k, v);
      }

      const h = BinaryTree.rootHash(tree);
      expect(h.some((b) => b !== 0)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns null for non-existent key", () => {
      const tree = BinaryTree.init();
      const k = new Uint8Array(32);

      const v = BinaryTree.get(tree, k);
      expect(v).toBeNull();
    });
  });

  describe("rootHashHex", () => {
    test("returns hex string", () => {
      const tree = BinaryTree.init();
      const h = BinaryTree.rootHashHex(tree);

      expect(h).toMatch(/^0x[0-9a-f]{64}$/);
      expect(h).toBe("0x" + "00".repeat(32));
    });

    test("returns different hash after insert", () => {
      let tree = BinaryTree.init();
      const h1 = BinaryTree.rootHashHex(tree);

      const k = new Uint8Array(32);
      const v = new Uint8Array(32);
      v[0] = 1;

      tree = BinaryTree.insert(tree, k, v);
      const h2 = BinaryTree.rootHashHex(tree);

      expect(h1).not.toBe(h2);
    });
  });
});
