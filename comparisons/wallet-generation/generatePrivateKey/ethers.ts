import { ethers } from "ethers";

export function main(): string {
	const wallet = ethers.Wallet.createRandom();
	return wallet.privateKey;
}
