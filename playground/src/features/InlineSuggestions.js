export class InlineSuggestions {
	/** @param {any} monaco */
	register(_monaco) {
		return { dispose: () => {} };
	}

	destroy() {
		// Stub: cleanup
	}
}

/** @param {InlineSuggestions} inlineSuggestions */
export function createInlineSuggestionsButton(_inlineSuggestions) {
	const button = document.createElement("button");
	button.textContent = "Suggestions";
	return button;
}
