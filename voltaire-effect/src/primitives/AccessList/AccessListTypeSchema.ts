/**
 * @module AccessListTypeSchema
 * @description Effect Schema declaration for BrandedAccessList type
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import * as S from "effect/Schema";

/**
 * Schema declaration for the BrandedAccessList type
 * @since 0.1.0
 */
export const AccessListTypeSchema = S.declare<BrandedAccessList>(
  (u): u is BrandedAccessList => AccessList.is(u),
  { identifier: "AccessList" },
);
