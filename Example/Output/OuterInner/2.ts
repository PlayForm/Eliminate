function outer() {
	console.log(42);

	function inner(x: 5) {
		console.log(42);

		console.log(42);
	}
}
