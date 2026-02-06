/**
 * @module convert
 * @description Pure ENS conversion functions
 * @since 0.1.0
 */
import { Ens } from "@tevm/voltaire";
import type { EnsType } from "./String.js";

/**
 * Convert ENS name to string
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional API name
export const toString = (name: EnsType): string => Ens.toString(name);
