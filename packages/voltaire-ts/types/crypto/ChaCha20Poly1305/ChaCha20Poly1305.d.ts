export * from "./constants.js";
export * from "./errors.js";
export namespace ChaCha20Poly1305 {
    export { generateKey };
    export { encrypt };
    export { decrypt };
    export { generateNonce };
    export { KEY_SIZE };
    export { NONCE_SIZE };
    export { TAG_SIZE };
}
import { generateKey } from "./generateKey.js";
import { encrypt } from "./encrypt.js";
import { decrypt } from "./decrypt.js";
import { generateNonce } from "./generateNonce.js";
import { KEY_SIZE } from "./constants.js";
import { NONCE_SIZE } from "./constants.js";
import { TAG_SIZE } from "./constants.js";
export { generateKey, encrypt, decrypt, generateNonce };
//# sourceMappingURL=ChaCha20Poly1305.d.ts.map