export * from "./constants.js";
export * from "./errors.js";
export namespace Ed25519 {
    export { keypairFromSeed };
    export { sign };
    export { verify };
    export { derivePublicKey };
    export { validateSecretKey };
    export { validatePublicKey };
    export { validateSeed };
    export { SECRET_KEY_SIZE };
    export { PUBLIC_KEY_SIZE };
    export { SIGNATURE_SIZE };
    export { SEED_SIZE };
}
import { keypairFromSeed } from "./keypairFromSeed.js";
import { sign } from "./sign.js";
import { verify } from "./verify.js";
import { derivePublicKey } from "./derivePublicKey.js";
import { validateSecretKey } from "./validateSecretKey.js";
import { validatePublicKey } from "./validatePublicKey.js";
import { validateSeed } from "./validateSeed.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";
import { SIGNATURE_SIZE } from "./constants.js";
import { SEED_SIZE } from "./constants.js";
export { keypairFromSeed, sign, verify, derivePublicKey, validateSecretKey, validatePublicKey, validateSeed };
//# sourceMappingURL=Ed25519.d.ts.map