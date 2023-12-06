import LogicCircuit from './logic_circuit';

const tripleAnd = new LogicCircuit({
	a: {
		inputs: [],
		behavior: 'buffer',
		pin: 'input',
	},
	b: {
		inputs: [],
		behavior: 'buffer',
		pin: 'input',
	},
	c: {
		inputs: [],
		behavior: 'buffer',
		pin: 'input',
	},
	mid: {
		inputs: ['a', 'b'],
		behavior: 'and',
	},
	q: {
		inputs: ['mid', 'c'],
		behavior: 'and',
		pin: 'output',
	}
});

// console.log(tripleAnd.execute(1, 1, 1))
export default tripleAnd;
