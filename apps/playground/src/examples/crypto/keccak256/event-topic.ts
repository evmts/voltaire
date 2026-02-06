import { Hex, Keccak256 } from "@tevm/voltaire";
// Example: Compute event topics for log filtering
const transferTopic = Keccak256.topic("Transfer(address,address,uint256)");

const approvalTopic = Keccak256.topic("Approval(address,address,uint256)");
