function Outer() {
	const Sample = 42;

	console.log(Sample);

	function Inner(X: 5) {
		console.log(X);

		console.log(X);
	}
}
