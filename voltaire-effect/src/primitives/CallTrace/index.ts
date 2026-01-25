/**
 * CallTrace module for analyzing EVM execution traces.
 * Provides utilities for working with call hierarchies and detecting errors.
 * @module
 * @since 0.0.1
 */
export {
	CallTraceSchema,
	CallTraceSchema as Schema,
} from "./CallTraceSchema.js";
export { flatten } from "./flatten.js";
export { getCalls } from "./getCalls.js";
export { hasError } from "./hasError.js";
