export * from "./ConstructorType.js";
export * from "./Constructor.js";
export type { ConstructorType, ConstructorInstance } from "./ConstructorType.js";

import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";

// Export individual functions
export { encodeParams, decodeParams };

// Type alias for backward compatibility
export type { ConstructorType as BrandedConstructor } from "./ConstructorType.js";
