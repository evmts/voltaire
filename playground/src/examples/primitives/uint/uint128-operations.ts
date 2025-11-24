import * as Uint128 from "../../../primitives/Uint128/index.js";
const ipv6Localhost = Uint128.fromHex("0x00000000000000000000000000000001"); // ::1
const ipv6Google = Uint128.fromHex("0x2001048860486860000000008888"); // 2001:4860:4860::8888
const uuid1 = Uint128.fromHex("0x550e8400e29b41d4a716446655440000");
const uuid2 = Uint128.fromHex("0x6ba7b8109dad11d180b400c04fd430c8");
const worldPopulation = Uint128.fromBigInt(8000000000n); // 8 billion
const starsInGalaxy = Uint128.fromBigInt(100000000000n); // 100 billion
const atomsInGram = Uint128.fromBigInt(602214076000000000000000n); // Avogadro
const a = Uint128.fromBigInt(1000000000000000000000n); // 10^21
const b = Uint128.fromBigInt(500000000000000000000n); // 5*10^20
const base = Uint128.fromNumber(2);
const x = Uint128.fromHex("0xffffffff00000000ffffffff00000000");
const y = Uint128.fromHex("0x00000000ffffffff00000000ffffffff");
const p = Uint128.fromNumber(48);
const q = Uint128.fromNumber(18);
const pow2 = Uint128.fromNumber(1024);
const test = Uint128.fromHex("0xff00ff00ff00ff00ff00ff00ff00ff00");
