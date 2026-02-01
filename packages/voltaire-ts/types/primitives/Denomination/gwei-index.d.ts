export type { BrandedGwei, GweiType } from "./GweiType.js";
export { GWEI_PER_ETHER, WEI_PER_GWEI } from "./gwei-constants.js";
import { from } from "./gwei-from.js";
import { fromEther } from "./gwei-fromEther.js";
import { fromWei } from "./gwei-fromWei.js";
import { toEther } from "./gwei-toEther.js";
import { toU256 } from "./gwei-toU256.js";
import { toWei } from "./gwei-toWei.js";
export { from, fromWei, fromEther, toWei, toEther, toU256 };
export declare const Gwei: {
    from: typeof from;
    fromWei: typeof fromWei;
    fromEther: typeof fromEther;
    toWei: typeof toWei;
    toEther: typeof toEther;
    toU256: typeof toU256;
};
//# sourceMappingURL=gwei-index.d.ts.map