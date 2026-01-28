/**
 * @module create
 * @description Effect-wrapped EventLog constructors
 * @since 0.1.0
 */
import { Effect } from "effect";
import * as EventLog from "@tevm/voltaire/EventLog";
import type { EventLogType } from "@tevm/voltaire/EventLog";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";

interface EventLogInput {
  address: AddressType;
  topics: HashType[];
  data: Uint8Array;
  blockNumber?: bigint;
  transactionHash?: HashType;
  transactionIndex?: number;
  blockHash?: HashType;
  logIndex?: number;
  removed?: boolean;
}

/**
 * Create EventLog from raw values
 *
 * @param input - EventLog data
 * @returns Effect yielding EventLogType
 */
export const create = (input: EventLogInput): Effect.Effect<EventLogType, Error> =>
  Effect.try({
    try: () => EventLog.create(input),
    catch: (e) => e as Error,
  });

/**
 * Create EventLog from various input formats
 *
 * @param input - EventLog data or compatible object
 * @returns Effect yielding EventLogType
 */
export const from = (input: unknown): Effect.Effect<EventLogType, Error> =>
  Effect.try({
    try: () => EventLog.from(input as EventLogInput),
    catch: (e) => e as Error,
  });
