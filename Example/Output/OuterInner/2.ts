function Outer() {
    console.log(42);
    function Inner(X: 5) {
        console.log(X);
        console.log(X);
    }
}
