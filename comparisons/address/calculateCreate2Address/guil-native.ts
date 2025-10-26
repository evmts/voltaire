import { Address } from "../../../src/typescript/native/primitives/address.native.js";

const deployer = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
const salt = new Uint8Array(32); // 32-byte salt
salt[31] = 1; // Set last byte to 1
const initCode = new Uint8Array([0x60, 0x80, 0x60, 0x40]); // Simple init code

export function main(): void {
	const contractAddress = Address.calculateCreate2Address(deployer, salt, initCode);
}
