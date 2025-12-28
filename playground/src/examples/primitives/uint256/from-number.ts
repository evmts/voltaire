import { Uint256 } from "voltaire";
// Create Uint256 from number
const small = Uint256.fromNumber(42);

// Create from larger number
const large = Uint256.fromNumber(1000000);

// Zero
const zero = Uint256.fromNumber(0);

// Max safe integer
const maxSafe = Uint256.fromNumber(Number.MAX_SAFE_INTEGER);
