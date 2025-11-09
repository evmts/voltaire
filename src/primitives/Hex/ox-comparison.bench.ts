/**
 * Ox vs Voltaire Hex Implementation Comparison
 *
 * Benchmarks comparing Ox-based implementation against current Voltaire implementation
 */

import { bench, group, run } from "mitata";

// Import Ox-based implementation
import * as OxHex from "./index.ox.js";

// Import current Voltaire implementation
import * as VoltaireHex from "./BrandedHex/index.js";

// Test data
const testBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
const testHex = "0xdeadbeef" as any;
const testNumber = 4660;
const testBigInt = 12345678901234567890n;
const testString = "hello world";

group("fromBytes", () => {
	bench("Ox", () => OxHex.fromBytes(testBytes));
	bench("Voltaire", () => VoltaireHex.fromBytes(testBytes));
});

group("toBytes", () => {
	bench("Ox", () => OxHex.toBytes(testHex));
	bench("Voltaire", () => VoltaireHex.toBytes(testHex));
});

group("fromNumber", () => {
	bench("Ox", () => OxHex.fromNumber(testNumber));
	bench("Voltaire", () => VoltaireHex.fromNumber(testNumber));
});

group("toNumber", () => {
	bench("Ox", () => OxHex.toNumber(testHex));
	bench("Voltaire", () => VoltaireHex.toNumber(testHex));
});

group("fromBigInt", () => {
	bench("Ox", () => OxHex.fromBigInt(testBigInt));
	bench("Voltaire", () => VoltaireHex.fromBigInt(testBigInt));
});

group("toBigInt", () => {
	bench("Ox", () => OxHex.toBigInt(testHex));
	bench("Voltaire", () => VoltaireHex.toBigInt(testHex));
});

group("fromString", () => {
	bench("Ox", () => OxHex.fromString(testString));
	bench("Voltaire", () => VoltaireHex.fromString(testString));
});

group("toString", () => {
	bench("Ox", () => OxHex.toString("0x68656c6c6f"));
	bench("Voltaire", () => VoltaireHex.toString("0x68656c6c6f" as any));
});

group("concat", () => {
	bench("Ox", () => OxHex.concat("0x12" as any, "0x34" as any));
	bench("Voltaire", () => VoltaireHex.concat("0x12" as any, "0x34" as any));
});

group("slice", () => {
	bench("Ox", () => OxHex.slice("0x1234567890" as any, 1, 3));
	bench("Voltaire", () => VoltaireHex.slice("0x1234567890" as any, 1, 3));
});

group("pad (padLeft)", () => {
	bench("Ox", () => OxHex.pad("0x1234" as any, 4));
	bench("Voltaire", () => VoltaireHex.pad("0x1234" as any, 4));
});

group("trim (trimLeft)", () => {
	bench("Ox", () => OxHex.trim("0x00001234" as any));
	bench("Voltaire", () => VoltaireHex.trim("0x00001234" as any));
});

group("equals (isEqual)", () => {
	bench("Ox", () => OxHex.equals("0x1234" as any, "0x1234" as any));
	bench("Voltaire", () => VoltaireHex.equals("0x1234" as any, "0x1234" as any));
});

group("size", () => {
	bench("Ox", () => OxHex.size(testHex));
	bench("Voltaire", () => VoltaireHex.size(testHex));
});

group("validate", () => {
	bench("Ox", () => OxHex.validate(testHex));
	bench("Voltaire", () => VoltaireHex.validate(testHex));
});

group("random", () => {
	bench("Ox", () => OxHex.random(32));
	bench("Voltaire", () => VoltaireHex.random(32));
});

// Voltaire-specific extensions (no Ox comparison)
group("xor (Voltaire only)", () => {
	bench("Ox extension", () => OxHex.xor("0xff" as any, "0x0f" as any));
	bench("Voltaire", () => VoltaireHex.xor("0xff" as any, "0x0f" as any));
});

group("zero (Voltaire only)", () => {
	bench("Ox extension", () => OxHex.zero(32));
	bench("Voltaire", () => VoltaireHex.zero(32));
});

group("isSized (Voltaire only)", () => {
	bench("Ox extension", () => OxHex.isSized(testHex, 4));
	bench("Voltaire", () => VoltaireHex.isSized(testHex, 4));
});

run();
