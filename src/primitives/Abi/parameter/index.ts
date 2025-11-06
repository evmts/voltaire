// Export the Parameter class
export type { ParameterConstructor } from "./ParameterConstructor.js";
export { Parameter } from "./Parameter.js";

// Re-export BrandedParameter namespace and types
export type { BrandedParameter } from "./BrandedParameter/BrandedParameter.js";
export * as BrandedParameter from "./BrandedParameter/index.js";

// Re-export old Parameter types for compatibility
export type {
	Parameter as AbiParameter,
	ParametersToPrimitiveTypes,
	ParametersToObject,
} from "../Parameter.js";
