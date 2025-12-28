import { BlockBody } from "voltaire";
// Empty Block: Create and validate empty block body

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
