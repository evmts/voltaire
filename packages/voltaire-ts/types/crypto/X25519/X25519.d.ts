export * from "./constants.js";
export * from "./errors.js";
export namespace X25519 {
    export { derivePublicKey };
    export { scalarmult };
    export { keypairFromSeed };
    export { generateSecretKey };
    export { generateKeypair };
    export { validateSecretKey };
    export { validatePublicKey };
    export { isValidPublicKey };
    export { isWeakPublicKey };
    export { SECRET_KEY_SIZE };
    export { PUBLIC_KEY_SIZE };
    export { SHARED_SECRET_SIZE };
}
import { derivePublicKey } from "./derivePublicKey.js";
import { generateKeypair } from "./generateKeypair.js";
import { generateSecretKey } from "./generateSecretKey.js";
import { isValidPublicKey } from "./isValidPublicKey.js";
import { isWeakPublicKey } from "./isWeakPublicKey.js";
import { keypairFromSeed } from "./keypairFromSeed.js";
import { scalarmult } from "./scalarmult.js";
import { validatePublicKey } from "./validatePublicKey.js";
import { validateSecretKey } from "./validateSecretKey.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { PUBLIC_KEY_SIZE } from "./constants.js";
import { SHARED_SECRET_SIZE } from "./constants.js";
export { derivePublicKey, generateKeypair, generateSecretKey, isValidPublicKey, isWeakPublicKey, keypairFromSeed, scalarmult, validatePublicKey, validateSecretKey };
//# sourceMappingURL=X25519.d.ts.map