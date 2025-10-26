import { ethers } from 'ethers';

const abi = ['error InsufficientBalance(uint256 available, uint256 required)'];
const iface = new ethers.Interface(abi);

const available = 50n;
const required = 100n;

export function main(): void {
  const encoded = iface.encodeErrorResult('InsufficientBalance', [available, required]);
}
