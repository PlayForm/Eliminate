export function _Function(A: number): boolean {
	return A >= 1;
}

export function Usage(): boolean {
	if (_Function(2)) {
		return true;
	} else {
		return false;
	}
}
