function outer() {
    const x = 42;
    console.log(x);
    function inner(x: 5) {
        console.log(x);
        console.log(x);
    }
}
