const _Object = { A: 1, B: 2 };

const { A: a } = _Object;

// @ts-ignore
const Usage = a;
