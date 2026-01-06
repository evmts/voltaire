#!/usr/bin/env bun
/**
 * Script to list and categorize all open GitHub issues for processing
 * Outputs JSON with issue data and recommendations for each issue
 */

import { $ } from "bun";

interface Issue {
	number: number;
	title: string;
	body: string;
	labels: { name: string }[];
}

interface IssueAnalysis {
	issue: Issue;
	category: "bug" | "feature" | "enhancement" | "refactor" | "unknown";
	complexity: "trivial" | "simple" | "moderate" | "complex";
	autoFixable: boolean;
	skipReason?: string;
	recommendation: string;
}

const SKIP_LABELS = ["wontfix", "duplicate", "invalid", "question"];

async function getOpenIssues(): Promise<Issue[]> {
	const result = await $`gh issue list --state open --limit 100 --json number,title,body,labels`.text();
	return JSON.parse(result);
}

function analyzeIssue(issue: Issue): IssueAnalysis {
	const title = issue.title.toLowerCase();
	const body = issue.body?.toLowerCase() || "";

	// Check skip labels
	for (const label of issue.labels) {
		if (SKIP_LABELS.includes(label.name.toLowerCase())) {
			return {
				issue,
				category: "unknown",
				complexity: "complex",
				autoFixable: false,
				skipReason: `Has label: ${label.name}`,
				recommendation: "Skip - has skip label",
			};
		}
	}

	// Categorize
	let category: IssueAnalysis["category"] = "unknown";
	if (title.includes("bug:") || title.includes("bug")) category = "bug";
	else if (title.includes("add") || title.includes("implement") || title.includes("missing")) category = "feature";
	else if (title.includes("improve") || title.includes("enhancement")) category = "enhancement";
	else if (title.includes("cleanup") || title.includes("refactor")) category = "refactor";

	// Estimate complexity
	let complexity: IssueAnalysis["complexity"] = "moderate";
	let autoFixable = true;
	let recommendation = "";

	// Complex: requires new modules
	if (title.includes("missing") && (title.includes("module") || title.includes("support"))) {
		complexity = "complex";
		autoFixable = false;
		recommendation = "Requires implementing new module - needs design first";
	}
	// Complex: architectural changes
	else if (title.includes("tracking:") || title.includes("audit:")) {
		complexity = "complex";
		autoFixable = false;
		recommendation = "Meta/tracking issue - not directly fixable";
	}
	// Simple: API signature fixes, missing exports
	else if (title.includes("export") || title.includes("missing runtime")) {
		complexity = "simple";
		autoFixable = true;
		recommendation = "Add missing export to index.ts";
	}
	// Simple: API compatibility
	else if (title.includes("incompatible") || title.includes("throws")) {
		complexity = "simple";
		autoFixable = true;
		recommendation = "Fix API compatibility issue";
	}
	// Moderate: validation, error handling
	else if (title.includes("validation") || title.includes("validate")) {
		complexity = "moderate";
		autoFixable = true;
		recommendation = "Add validation logic";
	}
	// Trivial: typos, docs, comments
	else if (title.includes("typo") || title.includes("comment") || title.includes("jsdoc")) {
		complexity = "trivial";
		autoFixable = true;
		recommendation = "Quick fix - documentation or typo";
	}

	return { issue, category, complexity, autoFixable, recommendation };
}

async function main() {
	const issues = await getOpenIssues();
	issues.sort((a, b) => a.number - b.number);

	const analyses = issues.map(analyzeIssue);

	// Group by complexity for easier processing
	const trivial = analyses.filter((a) => a.complexity === "trivial" && a.autoFixable);
	const simple = analyses.filter((a) => a.complexity === "simple" && a.autoFixable);
	const moderate = analyses.filter((a) => a.complexity === "moderate" && a.autoFixable);
	const complex = analyses.filter((a) => a.complexity === "complex" || !a.autoFixable);

	console.log("=".repeat(60));
	console.log("OPEN ISSUES ANALYSIS");
	console.log("=".repeat(60));

	console.log(`\nTotal: ${issues.length} issues`);
	console.log(`  Trivial (auto-fixable): ${trivial.length}`);
	console.log(`  Simple (auto-fixable): ${simple.length}`);
	console.log(`  Moderate (auto-fixable): ${moderate.length}`);
	console.log(`  Complex (needs manual): ${complex.length}`);

	console.log("\n--- TRIVIAL ---");
	for (const a of trivial) {
		console.log(`#${a.issue.number}: ${a.issue.title}`);
		console.log(`  → ${a.recommendation}`);
	}

	console.log("\n--- SIMPLE ---");
	for (const a of simple) {
		console.log(`#${a.issue.number}: ${a.issue.title}`);
		console.log(`  → ${a.recommendation}`);
	}

	console.log("\n--- MODERATE ---");
	for (const a of moderate) {
		console.log(`#${a.issue.number}: ${a.issue.title}`);
		console.log(`  → ${a.recommendation}`);
	}

	console.log("\n--- COMPLEX (needs design/manual work) ---");
	for (const a of complex) {
		console.log(`#${a.issue.number}: ${a.issue.title}`);
		console.log(`  → ${a.recommendation || a.skipReason}`);
	}

	// Write full analysis to file
	await Bun.write("/tmp/issue-analysis.json", JSON.stringify(analyses, null, 2));
	console.log("\nFull analysis written to /tmp/issue-analysis.json");
}

main().catch(console.error);
