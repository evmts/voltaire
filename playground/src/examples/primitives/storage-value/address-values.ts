import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: Storing addresses in storage slots (right-padded with zeros)

// In EVM storage, addresses are stored as uint256 with the address in the rightmost 20 bytes

// Address as hex (addresses are 20 bytes, but storage is 32 bytes)
const addressHex = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

// Convert address to storage value (left-pad with zeros to 32 bytes)
const addressStorageHex =
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e";
const addrStorage = StorageValue.from(addressStorageHex);

console.log("Address in storage:", StorageValue.toHex(addrStorage));
console.log("As bigint:", StorageValue.toUint256(addrStorage).toString(16));

// Extract address from storage (last 20 bytes)
const extractAddress = (storage: Uint8Array): string => {
	const addressBytes = storage.slice(12, 32); // Skip first 12 bytes
	return (
		"0x" +
		Array.from(addressBytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
};

console.log("\nExtracted address:", extractAddress(addrStorage));

// Multiple addresses in storage
const addr1 = StorageValue.from(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const addr2 = StorageValue.from(
	"0x0000000000000000000000005aaed59320b9eb3cd462ddbaaefa21da757f30fb",
);

console.log("\nAddress 1:", extractAddress(addr1));
console.log("Address 2:", extractAddress(addr2));

// Zero address (common default value)
const zeroAddress = StorageValue.from(0n);
console.log("\nZero address in storage:", StorageValue.toHex(zeroAddress));
console.log("Extracted:", extractAddress(zeroAddress));

// Check if storage contains an address (non-zero in last 20 bytes)
const containsAddress = (storage: Uint8Array): boolean => {
	// Check if any of the last 20 bytes are non-zero
	for (let i = 12; i < 32; i++) {
		if (storage[i] !== 0) return true;
	}
	return false;
};

console.log("\naddrStorage contains address:", containsAddress(addrStorage));
console.log("zeroAddress contains address:", containsAddress(zeroAddress));

// Common ERC20 owner storage pattern
const ownerSlot = StorageValue.from(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
console.log("\nERC20 owner storage:", StorageValue.toHex(ownerSlot));
console.log("Owner address:", extractAddress(ownerSlot));
