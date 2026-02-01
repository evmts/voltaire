import { Hash } from "@tevm/voltaire";
// Example: Creating hashes from hex strings

// Ethereum transaction hash
const txHash = Hash.fromHex(
	"0xa4b1f606b66105fa45e33b1c5f5b5f4a9c6e5d3c2b1a0987654321fedcba9876",
);

// Block hash
const blockHash = Hash.fromHex(
	"0x3d6122660cc824376f11ee842f83addc3525e2dd6756b9bcf0affa6aa88cf741",
);

// With or without 0x prefix
const withPrefix = Hash.fromHex(
	"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
);
const withoutPrefix = Hash.fromHex(
	"deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
);
