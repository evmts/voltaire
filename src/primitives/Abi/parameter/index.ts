// Export the Parameter class
export type { ParameterConstructor } from "./ParameterConstructor.js";
export { Parameter } from "./Parameter.js";

// Re-export BrandedParameter types
export type { BrandedParameter } from "./BrandedParameter/BrandedParameter.js";

// Re-export old Parameter types for compatibility
export type {
	Parameter as AbiParameter,
	ParametersToPrimitiveTypes,
	ParametersToObject,
} from "../Parameter.js";

// Export methods from BrandedParameter
export { encode, decode, from } from "./BrandedParameter/index.js";
