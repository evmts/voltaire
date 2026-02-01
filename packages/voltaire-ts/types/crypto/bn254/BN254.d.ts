export * from "./constants.js";
export * from "./errors.js";
export * from "./Fp2.js";
export * from "./G1PointType.js";
export * from "./G2PointType.js";
export namespace BN254 {
    export { Fp };
    export { Fp2 };
    export { Fr };
    export { G1 };
    export { G2 };
    export { Pairing };
    export { serializeG1 };
    export { deserializeG1 };
    export { serializeG2 };
    export { deserializeG2 };
}
export default BN254;
import * as Fp from "./Fp/index.js";
import * as Fp2 from "./Fp2/index.js";
import * as Fr from "./Fr/index.js";
import * as G1 from "./G1/index.js";
import * as G2 from "./G2/index.js";
import * as Pairing from "./Pairing/index.js";
import { serializeG1 } from "./serializeG1.js";
import { deserializeG1 } from "./deserializeG1.js";
import { serializeG2 } from "./serializeG2.js";
import { deserializeG2 } from "./deserializeG2.js";
export { Fp, Fp2, Fr, G1, G2, Pairing, serializeG1, deserializeG1, serializeG2, deserializeG2 };
//# sourceMappingURL=BN254.d.ts.map