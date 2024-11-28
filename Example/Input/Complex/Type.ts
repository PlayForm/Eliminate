type ComplexType<T> = {
	Value: T;
	Timestamp: Date;
};

const Complex: ComplexType<string> = {
	Value: "Test",
	Timestamp: new Date(),
};

const Usage = Complex;
