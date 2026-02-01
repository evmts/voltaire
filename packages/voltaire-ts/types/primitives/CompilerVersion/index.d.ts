export type { CompilerVersionType } from "./CompilerVersionType.js";
import { compare as _compare } from "./compare.js";
import { from } from "./from.js";
import { getMajor as _getMajor } from "./getMajor.js";
import { getMinor as _getMinor } from "./getMinor.js";
import { getPatch as _getPatch } from "./getPatch.js";
import { isCompatible as _isCompatible } from "./isCompatible.js";
import { parse as _parse } from "./parse.js";
export { from };
export declare function parse(version: string): {
    major: number;
    minor: number;
    patch: number;
    commit?: string;
    prerelease?: string;
};
export declare function compare(a: string, b: string): number;
export declare function getMajor(version: string): number;
export declare function getMinor(version: string): number;
export declare function getPatch(version: string): number;
export declare function isCompatible(version: string, range: string): boolean;
export { _parse, _compare, _getMajor, _getMinor, _getPatch, _isCompatible };
export declare const CompilerVersion: {
    from: typeof from;
    parse: typeof parse;
    compare: typeof compare;
    getMajor: typeof getMajor;
    getMinor: typeof getMinor;
    getPatch: typeof getPatch;
    isCompatible: typeof isCompatible;
};
//# sourceMappingURL=index.d.ts.map