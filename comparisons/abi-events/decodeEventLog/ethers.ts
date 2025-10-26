import { ethers } from 'ethers';

const abi = ['event Transfer(address indexed from, address indexed to, uint256 value)'];
const iface = new ethers.Interface(abi);

const data = '0x0000000000000000000000000000000000000000000000000000000000000064';
const topics = [
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8'
];

export function main(): void {
  const decoded = iface.parseLog({ data, topics });
}
