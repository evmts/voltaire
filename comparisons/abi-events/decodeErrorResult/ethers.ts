import { ethers } from 'ethers';

const abi = ['error InsufficientBalance(uint256 available, uint256 required)'];
const iface = new ethers.Interface(abi);

const errorData = '0xcf47918100000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000064';

export function main(): void {
  const decoded = iface.parseError(errorData);
}
