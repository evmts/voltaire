import { Address, Bytes } from "@tevm/voltaire";
/**
 * Address Basics
 *
 * Demonstrates Voltaire Address primitive usage.
 * Try navigation features:
 * - F12: Go to Definition on "Address"
 * - Alt+F12: Peek Definition
 * - Shift+F12: Find All References
 * - Cmd/Ctrl+Click: Jump to Definition
 */

// Example: Address basics using namespace API

// Create addresses using factory methods
const addr1 = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const addr2 = Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const addr3 = Address.fromBytes(
	Bytes([
		0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62, 0xdd, 0xba,
		0xef, 0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd,
	]),
);
const addr1Lower = Address("0x742d35cc6634c0532925a3b844bc454e4438f44e");
const cloned = addr1.clone();
