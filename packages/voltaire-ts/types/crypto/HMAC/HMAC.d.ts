export { EmptyKeyError } from "./errors.js";
export namespace HMAC {
    export { sha256Hmac as sha256 };
    export { sha512Hmac as sha512 };
    export { SHA256_OUTPUT_SIZE };
    export { SHA512_OUTPUT_SIZE };
    export { EmptyKeyError };
}
import { sha256Hmac } from "./sha256.js";
import { sha512Hmac } from "./sha512.js";
import { OUTPUT_SIZE as SHA256_OUTPUT_SIZE } from "./sha256.js";
import { OUTPUT_SIZE as SHA512_OUTPUT_SIZE } from "./sha512.js";
import { EmptyKeyError } from "./errors.js";
export { OUTPUT_SIZE as SHA256_OUTPUT_SIZE, sha256Hmac as sha256 } from "./sha256.js";
export { OUTPUT_SIZE as SHA512_OUTPUT_SIZE, sha512Hmac as sha512 } from "./sha512.js";
//# sourceMappingURL=HMAC.d.ts.map