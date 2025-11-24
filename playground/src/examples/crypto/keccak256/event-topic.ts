import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Compute event topics for log filtering
const transferTopic = Keccak256.topic("Transfer(address,address,uint256)");

const approvalTopic = Keccak256.topic("Approval(address,address,uint256)");
