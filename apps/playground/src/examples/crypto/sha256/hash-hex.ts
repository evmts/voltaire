import { Hex, SHA256 } from "@tevm/voltaire";
// Hash hex string data with SHA256
const hexData = "0xdeadbeef";
const hash = SHA256.hashHex(hexData);

// Works without 0x prefix
const noPrefixHash = SHA256.hashHex("cafebabe");

// Hash longer hex strings
const longHex = `0x${"a".repeat(128)}`;
const longHash = SHA256.hashHex(longHex);

// fromHex() alias
const aliasHash = SHA256.fromHex(hexData);
