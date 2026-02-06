import { describe, expect, it } from "vitest";
import { from as weiFrom } from "../Denomination/Wei.js";
import { Hash } from "../Hash/index.js";
import { from as nonceFrom } from "../Nonce/from.js";
import * as StateRoot from "../StateRoot/index.js";
import { EMPTY_CODE_HASH, EMPTY_TRIE_HASH } from "./AccountStateType.js";
import { from } from "./from.js";
import { isEOA } from "./isEOA.js";
describe("AccountState.isEOA", () => {
    describe("EOA detection", () => {
        it("returns true for empty account", () => {
            const state = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            expect(isEOA(state)).toBe(true);
        });
        it("returns true for EOA with zero balance", () => {
            const state = from({
                nonce: nonceFrom(5n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            expect(isEOA(state)).toBe(true);
        });
        it("returns true for EOA with non-zero balance", () => {
            const state = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(1000000000000000000n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            expect(isEOA(state)).toBe(true);
        });
        it("returns true for EOA with high nonce", () => {
            const state = from({
                nonce: nonceFrom(1000000n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            expect(isEOA(state)).toBe(true);
        });
        it("returns true for EOA with nonce and balance", () => {
            const state = from({
                nonce: nonceFrom(42n),
                balance: weiFrom(5000000000000000000n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            expect(isEOA(state)).toBe(true);
        });
        it("returns true for EOA with maximum nonce", () => {
            const state = from({
                nonce: nonceFrom(2n ** 64n - 1n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            expect(isEOA(state)).toBe(true);
        });
        it("returns true for EOA with maximum balance", () => {
            const state = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(2n ** 256n - 1n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            expect(isEOA(state)).toBe(true);
        });
    });
    describe("contract detection", () => {
        it("returns false for contract with custom code hash", () => {
            const state = from({
                nonce: nonceFrom(1n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash("0x1234567890123456789012345678901234567890123456789012345678901234"),
            });
            expect(isEOA(state)).toBe(false);
        });
        it("returns false for contract with custom storage root", () => {
            const state = from({
                nonce: nonceFrom(1n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from("0xabcdef1234567890123456789012345678901234567890123456789012345678"),
                codeHash: Hash("0x1234567890123456789012345678901234567890123456789012345678901234"),
            });
            expect(isEOA(state)).toBe(false);
        });
        it("returns false for contract with both custom hashes", () => {
            const state = from({
                nonce: nonceFrom(1n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from("0xabcdef1234567890123456789012345678901234567890123456789012345678"),
                codeHash: Hash("0x1234567890123456789012345678901234567890123456789012345678901234"),
            });
            expect(isEOA(state)).toBe(false);
        });
        it("returns false for contract with balance", () => {
            const state = from({
                nonce: nonceFrom(1n),
                balance: weiFrom(1000000000000000000n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash("0x1234567890123456789012345678901234567890123456789012345678901234"),
            });
            expect(isEOA(state)).toBe(false);
        });
        it("returns false for contract with high nonce", () => {
            const state = from({
                nonce: nonceFrom(100n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash("0x1234567890123456789012345678901234567890123456789012345678901234"),
            });
            expect(isEOA(state)).toBe(false);
        });
        it("returns false for contract with zero nonce", () => {
            const state = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash("0x1234567890123456789012345678901234567890123456789012345678901234"),
            });
            expect(isEOA(state)).toBe(false);
        });
    });
    describe("edge cases", () => {
        it("distinguishes empty state from contract state correctly", () => {
            const eoaState = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(EMPTY_CODE_HASH),
            });
            const contractState = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
            });
            expect(isEOA(eoaState)).toBe(true);
            expect(isEOA(contractState)).toBe(false);
        });
        it("handles code hash that differs by one byte", () => {
            const almostEmpty = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a471";
            const state = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(almostEmpty),
            });
            expect(isEOA(state)).toBe(false);
        });
        it("handles code hash in different case", () => {
            const upperCaseEmpty = "0xC5D2460186F7233C927E7DB2DCC703C0E500B653CA82273B7BFAD8045D85A470";
            const state = from({
                nonce: nonceFrom(0n),
                balance: weiFrom(0n),
                storageRoot: StateRoot.from(EMPTY_TRIE_HASH),
                codeHash: Hash(upperCaseEmpty),
            });
            expect(isEOA(state)).toBe(true);
        });
    });
});
