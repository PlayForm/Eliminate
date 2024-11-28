function Outer() {
	const Sample = 42;
	console.log(Sample);

	function Inner(x: 5) {
		console.log(x);
		console.log(x);
	}
}
