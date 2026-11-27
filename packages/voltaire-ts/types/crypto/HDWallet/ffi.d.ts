/**
 * Load libwally via ffi-napi/ref-napi only when needed.
 *
 * @returns {Promise<Library>}
 */
export function getLibwally(): Promise<Library>;
export type Library = import("ffi-napi").Library;
//# sourceMappingURL=ffi.d.ts.map