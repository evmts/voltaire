// Export types

// Export errors
export * from "./errors.js";
export type {
	EncryptOptions,
	KeystoreV3,
	Pbkdf2Params,
	ScryptParams,
} from "./KeystoreType.js";

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
