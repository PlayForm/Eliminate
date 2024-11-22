type ComplexType<T> = {
	value: T;
	timestamp: Date;
};

const complex: ComplexType<string> = {
	value: "test",
	timestamp: new Date(),
};

const usage = complex;
