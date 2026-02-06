export * from "./errors.js";
export type { EncryptOptions, KeystoreV3, Pbkdf2Params, ScryptParams, } from "./KeystoreType.js";
import { decrypt } from "./decrypt.js";
import { encrypt } from "./encrypt.js";
export { decrypt, encrypt };
export declare const Keystore: {
    decrypt: typeof decrypt;
    encrypt: typeof encrypt;
};
export default Keystore;
//# sourceMappingURL=index.d.ts.map