function outer() {
	const x = 42;

	function inner() {
		console.log(x);
		console.log(x);
	}
}
