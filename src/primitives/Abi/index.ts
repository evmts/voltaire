// Main Abi class and types
export type { Abi } from "./Abi.js";

// Re-export everything else from Abi.js
export * from "./Abi.js";

// Re-export sub-namespaces for direct access (e.g., import * as Abi from './index.js'; Abi.Function)
export * as Function from "./function/index.js";
export * as Event from "./event/index.js";
export * as Error from "./error/index.js";
export * as Constructor from "./constructor/index.js";
export * as Parameter from "./parameter/index.js";

// Export Item namespace for generic ABI item operations
import { format } from "./BrandedAbi/format.js";
import { formatWithArgs } from "./BrandedAbi/formatWithArgs.js";
import { getItem } from "./BrandedAbi/getItem.js";

export const Item = {
	format,
	formatWithArgs,
	getItem,
};

// Export encoding/decoding utilities
export { encodeParameters, decodeParameters } from "./Encoding.js";
export { encodePacked } from "./encodePacked.js";

// Export ABI-level encode/decode operations
export { encode } from "./BrandedAbi/encode.js";
export { decode } from "./BrandedAbi/decode.js";
export { decodeData } from "./BrandedAbi/decodeData.js";
export { parseLogs } from "./BrandedAbi/parseLogs.js";

// Export error types
export {
	AbiEncodingError,
	AbiDecodingError,
	AbiParameterMismatchError,
	AbiItemNotFoundError,
	AbiInvalidSelectorError,
} from "./Errors.js";
