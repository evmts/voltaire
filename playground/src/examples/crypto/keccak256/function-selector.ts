import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Compute ERC-20 function selectors
const transferSelector = Keccak256.selector("transfer(address,uint256)");
console.log("transfer selector:", Hex.fromBytes(transferSelector));
console.log("Expected: 0xa9059cbb");

const approveSelector = Keccak256.selector("approve(address,uint256)");
console.log("approve selector:", Hex.fromBytes(approveSelector));
console.log("Expected: 0x095ea7b3");

const balanceOfSelector = Keccak256.selector("balanceOf(address)");
console.log("balanceOf selector:", Hex.fromBytes(balanceOfSelector));
console.log("Expected: 0x70a08231");

// Selector is first 4 bytes of keccak256 hash
const fullHash = Keccak256.hashString("transfer(address,uint256)");
const manualSelector = fullHash.slice(0, 4);
console.log(
	"Manual selector matches:",
	Hex.fromBytes(manualSelector) === Hex.fromBytes(transferSelector),
);
