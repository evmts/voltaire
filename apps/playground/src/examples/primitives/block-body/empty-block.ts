import { BlockBody } from "@tevm/voltaire";
// Empty Block: Create and validate empty block body

// Create completely empty block body
const emptyBlock = BlockBody({
	transactions: [],
	ommers: [],
});
const emptyPostShanghai = BlockBody({
	transactions: [],
	ommers: [],
	withdrawals: [],
});
