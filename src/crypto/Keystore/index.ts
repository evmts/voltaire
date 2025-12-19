// Export types
export type {
	KeystoreV3,
	EncryptOptions,
	ScryptParams,
	Pbkdf2Params,
} from "./KeystoreType.js";

// Export errors
export * from "./errors.js";

// Export main functions
import { decrypt } from "./decrypt.js";
import { encrypt } from "./encrypt.js";

export { decrypt, encrypt };

// Export as namespace (convenience)
export const Keystore = {
	decrypt,
	encrypt,
};

// Default export for dynamic imports
export default Keystore;
