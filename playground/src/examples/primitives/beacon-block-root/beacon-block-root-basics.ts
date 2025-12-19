import * as BeaconBlockRoot from "../../../primitives/BeaconBlockRoot/index.js";

// Example: BeaconBlockRoot basics

// EIP-4788: Beacon block root in the EVM
// Introduced in Cancun upgrade (March 2024)
// Exposes beacon chain block root (consensus layer) to execution layer

// Create from hex string (32 bytes)
const root1 = BeaconBlockRoot.fromHex(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// Create from bytes (32 bytes)
const root2 = BeaconBlockRoot.fromBytes(new Uint8Array(32).fill(0xff));

// Typical beacon block root from mainnet
const mainnetRoot = BeaconBlockRoot.from(
	"0x8e47c00dcd5d2d4e5b1f6e4c8e2fce50cf842a8c5a8b0b5c1e4d3a2b1c0d9e8f",
);

// Zero root (genesis or empty)
const zeroRoot = BeaconBlockRoot.fromBytes(new Uint8Array(32));

// Convert to hex
const hex1 = BeaconBlockRoot.toHex(root1);
const hex2 = BeaconBlockRoot.toHex(mainnetRoot);

// Compare roots
const same = BeaconBlockRoot.equals(root1, root1);
const different = BeaconBlockRoot.equals(root1, root2);
