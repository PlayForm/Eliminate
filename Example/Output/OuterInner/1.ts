function Outer() {
    const Sample = 42;
    function Inner() {
        console.log(Sample);
        console.log(Sample);
    }
}
