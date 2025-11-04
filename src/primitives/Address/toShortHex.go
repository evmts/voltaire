package address

func (a Address) ToShortHex(prefixLen, suffixLen int) string {
	if prefixLen <= 0 {
		prefixLen = 6
	}
	if suffixLen <= 0 {
		suffixLen = 4
	}

	hex := a.ToHex()
	if prefixLen+suffixLen >= 40 {
		return hex
	}

	// hex is "0x" + 40 chars, so we take first 2+prefixLen and last suffixLen
	return hex[:2+prefixLen] + "..." + hex[42-suffixLen:]
}

func (a Address) Format() string {
	return a.ToChecksummed()
}
