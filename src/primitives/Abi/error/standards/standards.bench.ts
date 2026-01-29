/**
 * Benchmark: ERC-6093 Standard Error Definitions
 *
 * Tests selector calculation and encoding for standard ERC errors
 */

import { bench, run } from "mitata";
import * as AbiError from "../index.js";
import {
	ERC20InsufficientBalance,
	ERC20InsufficientAllowance,
	ERC20InvalidSender,
	ERC20InvalidReceiver,
	ERC20InvalidApprover,
	ERC20InvalidSpender,
} from "./ERC20Errors.js";
import {
	ERC721InvalidOwner,
	ERC721NonexistentToken,
	ERC721IncorrectOwner,
	ERC721InvalidSender,
	ERC721InvalidReceiver,
	ERC721InsufficientApproval,
	ERC721InvalidApprover,
	ERC721InvalidOperator,
} from "./ERC721Errors.js";
import {
	ERC1155InsufficientBalance,
	ERC1155InvalidSender,
	ERC1155InvalidReceiver,
	ERC1155MissingApprovalForAll,
	ERC1155InvalidApprover,
	ERC1155InvalidOperator,
	ERC1155InvalidArrayLength,
} from "./ERC1155Errors.js";

// ============================================================================
// Test Data
// ============================================================================

const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
const testTokenId = 12345n;
const testBalance = 1000000000000000000n;
const testNeeded = 2000000000000000000n;

// ============================================================================
// ERC-20 Error Selectors
// ============================================================================

bench("getSelector - ERC20InsufficientBalance", () => {
	AbiError.getSelector(ERC20InsufficientBalance);
});

bench("getSelector - ERC20InsufficientAllowance", () => {
	AbiError.getSelector(ERC20InsufficientAllowance);
});

bench("getSelector - ERC20InvalidSender", () => {
	AbiError.getSelector(ERC20InvalidSender);
});

bench("getSelector - ERC20InvalidReceiver", () => {
	AbiError.getSelector(ERC20InvalidReceiver);
});

await run();

// ============================================================================
// ERC-721 Error Selectors
// ============================================================================

bench("getSelector - ERC721InvalidOwner", () => {
	AbiError.getSelector(ERC721InvalidOwner);
});

bench("getSelector - ERC721NonexistentToken", () => {
	AbiError.getSelector(ERC721NonexistentToken);
});

bench("getSelector - ERC721IncorrectOwner", () => {
	AbiError.getSelector(ERC721IncorrectOwner);
});

bench("getSelector - ERC721InsufficientApproval", () => {
	AbiError.getSelector(ERC721InsufficientApproval);
});

await run();

// ============================================================================
// ERC-1155 Error Selectors
// ============================================================================

bench("getSelector - ERC1155InsufficientBalance", () => {
	AbiError.getSelector(ERC1155InsufficientBalance);
});

bench("getSelector - ERC1155MissingApprovalForAll", () => {
	AbiError.getSelector(ERC1155MissingApprovalForAll);
});

bench("getSelector - ERC1155InvalidArrayLength", () => {
	AbiError.getSelector(ERC1155InvalidArrayLength);
});

await run();

// ============================================================================
// Error Signature Generation
// ============================================================================

bench("getSignature - ERC20InsufficientBalance", () => {
	AbiError.getSignature(ERC20InsufficientBalance);
});

bench("getSignature - ERC721IncorrectOwner", () => {
	AbiError.getSignature(ERC721IncorrectOwner);
});

bench("getSignature - ERC1155InsufficientBalance", () => {
	AbiError.getSignature(ERC1155InsufficientBalance);
});

await run();

// ============================================================================
// Error Encoding
// ============================================================================

bench("encodeParams - ERC20InsufficientBalance", () => {
	AbiError.encodeParams(ERC20InsufficientBalance, [
		testAddress,
		testBalance,
		testNeeded,
	] as [string, bigint, bigint]);
});

bench("encodeParams - ERC20InsufficientAllowance", () => {
	AbiError.encodeParams(ERC20InsufficientAllowance, [
		testAddress,
		testBalance,
		testNeeded,
	] as [string, bigint, bigint]);
});

bench("encodeParams - ERC20InvalidSender", () => {
	AbiError.encodeParams(ERC20InvalidSender, [testAddress] as [string]);
});

await run();

// ============================================================================
// Error Encoding - ERC-721
// ============================================================================

bench("encodeParams - ERC721NonexistentToken", () => {
	AbiError.encodeParams(ERC721NonexistentToken, [testTokenId] as [bigint]);
});

bench("encodeParams - ERC721IncorrectOwner", () => {
	AbiError.encodeParams(ERC721IncorrectOwner, [
		testAddress,
		testTokenId,
		testAddress,
	] as [string, bigint, string]);
});

bench("encodeParams - ERC721InsufficientApproval", () => {
	AbiError.encodeParams(ERC721InsufficientApproval, [
		testAddress,
		testTokenId,
	] as [string, bigint]);
});

await run();

// ============================================================================
// Error Encoding - ERC-1155
// ============================================================================

bench("encodeParams - ERC1155InsufficientBalance", () => {
	AbiError.encodeParams(ERC1155InsufficientBalance, [
		testAddress,
		testBalance,
		testNeeded,
		testTokenId,
	] as [string, bigint, bigint, bigint]);
});

bench("encodeParams - ERC1155InvalidArrayLength", () => {
	AbiError.encodeParams(ERC1155InvalidArrayLength, [10n, 5n] as [
		bigint,
		bigint,
	]);
});

await run();

// ============================================================================
// Full Error Data (selector + params)
// ============================================================================

bench("full error data - ERC20InsufficientBalance", () => {
	const selector = AbiError.getSelector(ERC20InsufficientBalance);
	const params = AbiError.encodeParams(ERC20InsufficientBalance, [
		testAddress,
		testBalance,
		testNeeded,
	] as [string, bigint, bigint]);
	const result = new Uint8Array(4 + params.length);
	result.set(selector, 0);
	result.set(params, 4);
});

bench("full error data - ERC721NonexistentToken", () => {
	const selector = AbiError.getSelector(ERC721NonexistentToken);
	const params = AbiError.encodeParams(ERC721NonexistentToken, [testTokenId] as [bigint]);
	const result = new Uint8Array(4 + params.length);
	result.set(selector, 0);
	result.set(params, 4);
});

await run();

// ============================================================================
// Batch Selector Lookup
// ============================================================================

bench("batch selectors - all ERC20 errors", () => {
	AbiError.getSelector(ERC20InsufficientBalance);
	AbiError.getSelector(ERC20InsufficientAllowance);
	AbiError.getSelector(ERC20InvalidSender);
	AbiError.getSelector(ERC20InvalidReceiver);
	AbiError.getSelector(ERC20InvalidApprover);
	AbiError.getSelector(ERC20InvalidSpender);
});

bench("batch selectors - all ERC721 errors", () => {
	AbiError.getSelector(ERC721InvalidOwner);
	AbiError.getSelector(ERC721NonexistentToken);
	AbiError.getSelector(ERC721IncorrectOwner);
	AbiError.getSelector(ERC721InvalidSender);
	AbiError.getSelector(ERC721InvalidReceiver);
	AbiError.getSelector(ERC721InsufficientApproval);
	AbiError.getSelector(ERC721InvalidApprover);
	AbiError.getSelector(ERC721InvalidOperator);
});

await run();
