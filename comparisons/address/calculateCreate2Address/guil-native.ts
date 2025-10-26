import {
	Address,
	calculateCreate2Address,
} from "../../../native/primitives/address.js";
import { hexToBytes } from "../../../native/primitives/hex.js";

const deployer = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
const salt = hexToBytes(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const initCodeHash = hexToBytes(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

export function main(): void {
	const contractAddress = calculateCreate2Address(deployer, salt, initCodeHash);
}
