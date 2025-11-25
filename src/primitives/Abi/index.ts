// Export factory function (runtime value)
export * from "./Abi.js";

// Export type definitions
export type * from "./Abi.js";

// Re-export encoding/decoding methods
export { encode } from "./encode.js";
export { decode } from "./decode.js";
export { decodeData } from "./decodeData.js";
export { parseLogs } from "./parseLogs.js";
export {
	encodeParameters,
	decodeParameters,
	Parameters,
	DecodeParameters,
} from "./Encoding.js";

// Re-export sub-namespaces for runtime (Abi.Function.*, Abi.Event.*, etc.)
export * as Function from "./function/index.js";
export * as Event from "./event/index.js";
export * as Error from "./error/index.js";
export * as Item from "./Item/index.js";
export * as Constructor from "./constructor/index.js";

// Re-export ERC standards
export { Interface } from "./interface/index.js";
export * from "./error/standards/index.js";
export * from "./error/wrapped/index.js";
