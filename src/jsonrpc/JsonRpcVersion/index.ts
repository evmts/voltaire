// Export type definition
export type { JsonRpcVersionType } from "./JsonRpcVersionType.js";

// Export constants
export { VERSION } from "./constants.js";

// Import functions
import { from } from "./from.js";

// Export constructors
export { from };

// Export as namespace (convenience)
export const JsonRpcVersion = {
	from,
	VERSION: "2.0" as const,
};
