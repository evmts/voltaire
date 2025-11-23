import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Compute event topics for log filtering
const transferTopic = Keccak256.topic("Transfer(address,address,uint256)");
console.log("Transfer topic:", Hex.fromBytes(transferTopic));
console.log(
	"Expected:",
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);

const approvalTopic = Keccak256.topic("Approval(address,address,uint256)");
console.log("Approval topic:", Hex.fromBytes(approvalTopic));
console.log(
	"Expected:",
	"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
);

// Topic is full 32-byte hash (unlike selector which is 4 bytes)
console.log("Topic length:", transferTopic.length, "bytes");

// Used as topics[0] in event logs
console.log("\nEvent log structure:");
console.log("topics[0]:", Hex.fromBytes(transferTopic), "(event signature)");
console.log("topics[1]: <indexed parameter 1>");
console.log("topics[2]: <indexed parameter 2>");
console.log("data: <non-indexed parameters>");
