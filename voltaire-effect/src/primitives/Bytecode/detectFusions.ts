/**
 * @module detectFusions
 * @description Detect fusion patterns in bytecode (pure)
 * @since 0.1.0
 */
import { detectFusions as _detectFusions } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const detectFusions = (code: BrandedBytecode): unknown =>
	_detectFusions(code);
