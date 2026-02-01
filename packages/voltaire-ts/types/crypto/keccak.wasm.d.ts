/**
 * @param {string | Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export function keccak256(data: string | Uint8Array): Promise<Uint8Array>;
/**
 * @param {string | Uint8Array} message
 * @returns {Promise<Uint8Array>}
 */
export function eip191HashMessage(message: string | Uint8Array): Promise<Uint8Array>;
export { Hash };
import { Hash } from "../primitives/Hash/index.js";
//# sourceMappingURL=keccak.wasm.d.ts.map