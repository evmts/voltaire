// Export the Parameter class
export type { ParameterConstructor } from "./ParameterConstructor.js";
export { Parameter } from "./Parameter.js";

// Re-export BrandedParameter types
export type { BrandedParameter } from "./BrandedParameter/BrandedParameter.js";
export type { BrandedParameter as AbiParameter } from "./BrandedParameter/BrandedParameter.js";

// Export methods from BrandedParameter
export { encode, decode, from } from "./BrandedParameter/index.js";
