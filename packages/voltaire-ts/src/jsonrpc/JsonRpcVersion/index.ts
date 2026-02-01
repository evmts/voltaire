// Export type definition

// Export constants
export { VERSION } from "./constants.js";
export type { JsonRpcVersionType } from "./JsonRpcVersionType.js";

// Import functions
import { from } from "./from.js";

// Export constructors
export { from };

// Export as namespace (convenience)
export const JsonRpcVersion = {
	from,
	VERSION: "2.0" as const,
};
