import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as S from "effect/Schema";
import * as AccessList from "./index.js";

const makeAddress = (byte: number): Uint8Array & { readonly __brand?: symbol } =>
  new Uint8Array(20).fill(byte) as Uint8Array & { readonly __brand?: symbol };

const makeHash = (byte: number): Uint8Array & { readonly __brand?: symbol } =>
  new Uint8Array(32).fill(byte) as Uint8Array & { readonly __brand?: symbol };

describe("AccessList", () => {
  describe("create", () => {
    it("creates empty access list", () => {
      const list = AccessList.create();
      expect(AccessList.isEmpty(list)).toBe(true);
      expect(AccessList.addressCount(list)).toBe(0);
    });
  });

  describe("from", () => {
    it("creates from items", async () => {
      const addr = makeAddress(0x42);
      const key = makeHash(0x01);
      const list = await Effect.runPromise(
        AccessList.from([{ address: addr, storageKeys: [key] }])
      );
      expect(AccessList.addressCount(list)).toBe(1);
      expect(AccessList.storageKeyCount(list)).toBe(1);
    });
  });

  describe("type guards", () => {
    it("is() validates access list", () => {
      const list = AccessList.create();
      expect(AccessList.is(list)).toBe(true);
      expect(AccessList.is([])).toBe(true);
      expect(AccessList.is("not a list")).toBe(false);
      expect(AccessList.is([{ invalid: true }])).toBe(false);
    });

    it("isItem() validates items", () => {
      const addr = makeAddress(0x42);
      const key = makeHash(0x01);
      expect(AccessList.isItem({ address: addr, storageKeys: [key] })).toBe(true);
      expect(AccessList.isItem({ address: addr, storageKeys: [] })).toBe(true);
      expect(AccessList.isItem({ address: "0x123", storageKeys: [] })).toBe(false);
      expect(AccessList.isItem(null)).toBe(false);
    });
  });

  describe("queries", () => {
    it("isEmpty", () => {
      expect(AccessList.isEmpty(AccessList.create())).toBe(true);
    });

    it("addressCount", () => {
      const addr1 = makeAddress(0x01);
      const addr2 = makeAddress(0x02);
      let list = AccessList.create();
      list = AccessList.withAddress(list, addr1);
      list = AccessList.withAddress(list, addr2);
      expect(AccessList.addressCount(list)).toBe(2);
    });

    it("storageKeyCount", () => {
      const addr = makeAddress(0x42);
      const key1 = makeHash(0x01);
      const key2 = makeHash(0x02);
      let list = AccessList.create();
      list = AccessList.withStorageKey(list, addr, key1);
      list = AccessList.withStorageKey(list, addr, key2);
      expect(AccessList.storageKeyCount(list)).toBe(2);
    });

    it("includesAddress", () => {
      const addr = makeAddress(0x42);
      const other = makeAddress(0x43);
      let list = AccessList.create();
      list = AccessList.withAddress(list, addr);
      expect(AccessList.includesAddress(list, addr)).toBe(true);
      expect(AccessList.includesAddress(list, other)).toBe(false);
    });

    it("includesStorageKey", () => {
      const addr = makeAddress(0x42);
      const key = makeHash(0x01);
      const other = makeHash(0x02);
      let list = AccessList.create();
      list = AccessList.withStorageKey(list, addr, key);
      expect(AccessList.includesStorageKey(list, addr, key)).toBe(true);
      expect(AccessList.includesStorageKey(list, addr, other)).toBe(false);
    });

    it("keysFor", () => {
      const addr = makeAddress(0x42);
      const key = makeHash(0x01);
      let list = AccessList.create();
      list = AccessList.withStorageKey(list, addr, key);
      const keys = AccessList.keysFor(list, addr);
      expect(keys).toBeDefined();
      expect(keys?.length).toBe(1);
      expect(AccessList.keysFor(list, makeAddress(0x99))).toBeUndefined();
    });
  });

  describe("gas calculations", () => {
    it("gasCost", () => {
      const addr = makeAddress(0x42);
      const key = makeHash(0x01);
      let list = AccessList.create();
      list = AccessList.withStorageKey(list, addr, key);
      const cost = AccessList.gasCost(list);
      expect(cost).toBe(AccessList.ADDRESS_COST + AccessList.STORAGE_KEY_COST);
    });

    it("gasSavings", () => {
      const addr = makeAddress(0x42);
      let list = AccessList.create();
      list = AccessList.withAddress(list, addr);
      const savings = AccessList.gasSavings(list);
      expect(savings).toBe(AccessList.COLD_ACCOUNT_ACCESS_COST - AccessList.ADDRESS_COST);
    });

    it("hasSavings", () => {
      const addr = makeAddress(0x42);
      let list = AccessList.create();
      list = AccessList.withAddress(list, addr);
      expect(AccessList.hasSavings(list)).toBe(true);
    });
  });

  describe("transformations", () => {
    it("withAddress adds new address", () => {
      const addr = makeAddress(0x42);
      let list = AccessList.create();
      list = AccessList.withAddress(list, addr);
      expect(AccessList.includesAddress(list, addr)).toBe(true);
    });

    it("withAddress is idempotent", () => {
      const addr = makeAddress(0x42);
      let list = AccessList.create();
      list = AccessList.withAddress(list, addr);
      const list2 = AccessList.withAddress(list, addr);
      expect(AccessList.addressCount(list2)).toBe(1);
    });

    it("withStorageKey adds key", () => {
      const addr = makeAddress(0x42);
      const key = makeHash(0x01);
      let list = AccessList.create();
      list = AccessList.withStorageKey(list, addr, key);
      expect(AccessList.includesStorageKey(list, addr, key)).toBe(true);
    });

    it("deduplicate merges duplicate addresses", () => {
      const addr = makeAddress(0x42);
      const key1 = makeHash(0x01);
      const key2 = makeHash(0x02);
      const list = [
        { address: addr, storageKeys: [key1] },
        { address: addr, storageKeys: [key2, key1] },
      ] as AccessList.BrandedAccessList;
      const deduped = AccessList.deduplicate(list);
      expect(AccessList.addressCount(deduped)).toBe(1);
      expect(AccessList.storageKeyCount(deduped)).toBe(2);
    });

    it("merge combines lists", () => {
      const addr1 = makeAddress(0x01);
      const addr2 = makeAddress(0x02);
      const list1 = AccessList.withAddress(AccessList.create(), addr1);
      const list2 = AccessList.withAddress(AccessList.create(), addr2);
      const merged = AccessList.merge(list1, list2);
      expect(AccessList.addressCount(merged)).toBe(2);
    });

    it("toBytes encodes to RLP", () => {
      const list = AccessList.create();
      const bytes = AccessList.toBytes(list);
      expect(bytes).toBeInstanceOf(Uint8Array);
    });
  });

  describe("assertValid", () => {
    it("succeeds for valid list", async () => {
      const list = AccessList.create();
      await Effect.runPromise(AccessList.assertValid(list));
    });
  });

  describe("Rpc schema", () => {
    it("decodes from JSON-RPC format", () => {
      const input = [
        {
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
          storageKeys: [
            "0x0000000000000000000000000000000000000000000000000000000000000001",
          ],
        },
      ];
      const list = S.decodeSync(AccessList.Rpc)(input);
      expect(AccessList.addressCount(list)).toBe(1);
      expect(AccessList.storageKeyCount(list)).toBe(1);
    });

    it("encodes to JSON-RPC format", () => {
      const addr = makeAddress(0x42);
      const key = makeHash(0x01);
      let list = AccessList.create();
      list = AccessList.withStorageKey(list, addr, key);
      const json = S.encodeSync(AccessList.Rpc)(list);
      expect(json).toHaveLength(1);
      expect(json[0].address).toMatch(/^0x[0-9a-f]{40}$/);
      expect(json[0].storageKeys).toHaveLength(1);
    });
  });

  describe("constants", () => {
    it("exports gas constants", () => {
      expect(AccessList.ADDRESS_COST).toBe(2400n);
      expect(AccessList.STORAGE_KEY_COST).toBe(1900n);
      expect(AccessList.COLD_ACCOUNT_ACCESS_COST).toBe(2600n);
      expect(AccessList.COLD_STORAGE_ACCESS_COST).toBe(2100n);
      expect(AccessList.WARM_STORAGE_ACCESS_COST).toBe(100n);
    });
  });
});
