// Empty Block: Create and validate empty block body
import * as BlockBody from "../../../primitives/BlockBody/index.js";

// Create completely empty block body
const emptyBlock = BlockBody.from({
	transactions: [],
	ommers: [],
});
const emptyPostShanghai = BlockBody.from({
	transactions: [],
	ommers: [],
	withdrawals: [],
});
