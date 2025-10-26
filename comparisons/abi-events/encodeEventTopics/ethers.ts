import { ethers } from "ethers";

const abi = [
	"event Transfer(address indexed from, address indexed to, uint256 value)",
];
const iface = new ethers.Interface(abi);

const from = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const to = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

export function main(): void {
	const topics = iface.encodeFilterTopics("Transfer", [from, to]);
}
