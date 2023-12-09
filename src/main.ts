import LogicCircuit from './logic_circuit/logic_circuit.ts'

const tripleAnd = new LogicCircuit({
  name: 'TripleAnd',
  inputs: ['A', 'B', 'C'],
  outputs: ['Q', '~Q'],
  components: {
    and1: {
      inputs: ['A', 'B'],
      behavior: 'and',
    },
    Q: {
      inputs: ['and1', 'C'],
      behavior: 'and',
    },
    '~Q': {
      inputs: ['Q'],
      behavior: 'not',
    },
  }
});

console.table(tripleAnd.getState({ A: 1, B: 1, C: 1 }));
