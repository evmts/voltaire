import { Address } from "../../../src/primitives/address.ts";

const testAddress1 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const testAddress2 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const address1 = Address.fromHex(testAddress1);
const address2 = Address.fromHex(testAddress2);

export function main(): void {
	const result = address1.equals(address2);
}
