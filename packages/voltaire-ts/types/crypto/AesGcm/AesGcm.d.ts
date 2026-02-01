export * from "./constants.js";
export * from "./errors.js";
export namespace AesGcm {
    export { generateKey };
    export { importKey };
    export { exportKey };
    export { encrypt };
    export { decrypt };
    export { generateNonce };
    export { deriveKey };
    export { AES128_KEY_SIZE };
    export { AES256_KEY_SIZE };
    export { NONCE_SIZE };
    export { TAG_SIZE };
}
import { generateKey } from "./generateKey.js";
import { importKey } from "./importKey.js";
import { exportKey } from "./exportKey.js";
import { encrypt } from "./encrypt.js";
import { decrypt } from "./decrypt.js";
import { generateNonce } from "./generateNonce.js";
import { deriveKey } from "./deriveKey.js";
import { AES128_KEY_SIZE } from "./constants.js";
import { AES256_KEY_SIZE } from "./constants.js";
import { NONCE_SIZE } from "./constants.js";
import { TAG_SIZE } from "./constants.js";
export { generateKey, importKey, exportKey, encrypt, decrypt, generateNonce, deriveKey };
//# sourceMappingURL=AesGcm.d.ts.map