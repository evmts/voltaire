export { COMMON_LICENSES, OSI_APPROVED_LICENSES, } from "./constants.js";
export type { LicenseType } from "./LicenseType.js";
import { from } from "./from.js";
import { isOSI as _isOSI } from "./isOSI.js";
import { toString as _toString } from "./toString.js";
export { from };
export declare function isOSI(license: string): boolean;
export declare function toString(license: string): string;
export { _isOSI, _toString };
export declare const License: {
    from: typeof from;
    isOSI: typeof isOSI;
    toString: typeof toString;
    COMMON_LICENSES: string[];
    OSI_APPROVED_LICENSES: string[];
};
//# sourceMappingURL=index.d.ts.map