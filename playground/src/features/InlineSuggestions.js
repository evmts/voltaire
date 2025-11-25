export class InlineSuggestions {
	/** @param {any} monaco */
	register(monaco) {
		return { dispose: () => {} };
	}

	destroy() {
		// Stub: cleanup
	}
}

/** @param {InlineSuggestions} inlineSuggestions */
export function createInlineSuggestionsButton(inlineSuggestions) {
	const button = document.createElement("button");
	button.textContent = "Suggestions";
	return button;
}
