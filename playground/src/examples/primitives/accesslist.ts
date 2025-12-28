import { AccessList, Address, Bytes, Bytes32, Hash, Hex } from "@tevm/voltaire";

// === Creating Access Lists ===
// Single address, no storage keys
const simpleList = AccessList([
	{
		address: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
		storageKeys: [],
	},
]);

// Address with storage keys
const withStorage = AccessList([
	{
		address: Address("0xdead000000000000000000000000000000000001"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			),
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		],
	},
]);

// Multiple addresses
const multiAddress = AccessList([
	{
		address: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			),
		],
	},
	{
		address: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000005",
			),
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000006",
			),
		],
	},
]);

// === Common ERC-20 Storage Slots ===
// balanceOf slot for address
const holderAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const balanceSlot = 0n; // ERC-20 balances typically at slot 0

// Calculate storage key: keccak256(abi.encode(address, slot))
const paddedAddress = Bytes.zero(64);
paddedAddress.set(holderAddress, 12); // Left-pad address to 32 bytes
// Slot goes in last 32 bytes
const slotBytes = Bytes32.zero();
// For demonstration, using placeholder
const storageKey = Hash(
	"0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
);

const erc20AccessList = AccessList([
	{
		address: Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
		storageKeys: [storageKey],
	},
]);

// === Access List Serialization ===
const serialized = multiAddress.toBytes();

// === Gas Estimation ===
// Access list gas costs (EIP-2930):
// - 2400 gas per address
// - 1900 gas per storage key
const addressCount = multiAddress.length;
const storageKeyCount = multiAddress.reduce(
	(sum, entry) => sum + entry.storageKeys.length,
	0,
);
const accessListGas = addressCount * 2400 + storageKeyCount * 1900;

// === Empty Access List ===
const emptyList = AccessList([]);
