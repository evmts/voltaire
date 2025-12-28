import { Hex, Keccak256 } from "@tevm/voltaire";
// Example: Compute ERC-20 function selectors
const transferSelector = Keccak256.selector("transfer(address,uint256)");

const approveSelector = Keccak256.selector("approve(address,uint256)");

const balanceOfSelector = Keccak256.selector("balanceOf(address)");

// Selector is first 4 bytes of keccak256 hash
const fullHash = Keccak256.hashString("transfer(address,uint256)");
const manualSelector = fullHash.slice(0, 4);
