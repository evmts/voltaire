import { RIPEMD160 } from "@tevm/voltaire";
import { Hex } from "@tevm/voltaire";

// Hash hex strings directly
const hexData = "0xdeadbeef";
const hash = RIPEMD160.hashHex(hexData);

// Works with or without 0x prefix
const withoutPrefix = RIPEMD160.hashHex("cafebabe");

// Hash public key hex
const pubKeyHex =
	"0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
const pubKeyHash = RIPEMD160.hashHex(pubKeyHex);

// Empty hex
const emptyHash = RIPEMD160.hashHex("0x");
