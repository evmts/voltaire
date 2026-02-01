/**
 * Convert hex character to numeric value
 * @internal
 */
export function hexCharToValue(c: string | undefined): number | null {
	if (!c) return null;
	const code = c.charCodeAt(0);
	if (code >= 48 && code <= 57) return code - 48; // 0-9
	if (code >= 97 && code <= 102) return code - 97 + 10; // a-f
	if (code >= 65 && code <= 70) return code - 65 + 10; // A-F
	return null;
}
