/**
 * BIP-39 Wordlists
 * Multi-language wordlist support for mnemonic phrases
 */

/**
 * Abstract base class for wordlists
 */
export abstract class Wordlist {
	/**
	 * Get word at index (0-2047)
	 */
	abstract getWord(index: number): string;

	/**
	 * Get index of word
	 */
	abstract getWordIndex(word: string): number;

	/**
	 * Split phrase into words
	 */
	split(phrase: string): string[] {
		throw new Error("not implemented");
	}

	/**
	 * Join words into phrase
	 */
	join(words: string[]): string {
		throw new Error("not implemented");
	}
}

/**
 * Compressed wordlist using OWL format (ASCII-7)
 */
export class WordlistOwl extends Wordlist {
	getWord(index: number): string {
		throw new Error("not implemented");
	}

	getWordIndex(word: string): number {
		throw new Error("not implemented");
	}
}

/**
 * Compressed wordlist with diacritic support (Latin-1)
 */
export class WordlistOwlA extends Wordlist {
	getWord(index: number): string {
		throw new Error("not implemented");
	}

	getWordIndex(word: string): number {
		throw new Error("not implemented");
	}
}

/**
 * Language-specific wordlists
 */
export class LangEn {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangEs {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangFr {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangIt {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangPt {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangJa {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangKo {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangCz {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangZhCn {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}

export class LangZhTw {
	static wordlist(): Wordlist {
		throw new Error("not implemented");
	}
}
