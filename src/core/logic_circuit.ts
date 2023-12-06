export type Bit = 0 | 1;

export type SingleBehavior = (a: Bit) => Bit;
export type DualBehavior = (a: Bit, b: Bit) => Bit;
export type Behavior = SingleBehavior | DualBehavior;

export interface BehaviorStore {
	[behaviorName: string]: Behavior
};

export type BehaviorName<T extends BehaviorStore> = keyof T;
export type BehaveAsFunction<T extends BehaviorStore, K extends keyof T> =
	(behaviorName: K, ...inputs: Parameters<T[K]>) => Bit;

export type ComponentInput<T extends BehaviorStore> = BehaviorName<T> | Bit;
export interface Component<T extends BehaviorStore> {
	behavior: BehaviorName<T>;
	inputs: ComponentInput<T>[];
	pin?: 'input' | 'output';
}
export interface ComponentsMap<T extends BehaviorStore> {
	[componentId: string]: Component<T>;
}

export type SimulatorState = { [componentId: string]: Bit };
export type BehaviorTestResult<T extends BehaviorStore, K extends BehaviorName<T>> = {
	inputs: Parameters<T[K]>,
	state: Bit,
};

export interface MainBehaviors extends BehaviorStore {
	and(a: Bit, b: Bit): Bit;
	or(a: Bit, b: Bit): Bit;
	xor(a: Bit, b: Bit): Bit;
	buffer(a: Bit): Bit;
	not(a: Bit): Bit;
}

export default class LogicCircuit<T extends MainBehaviors = MainBehaviors> {
	private state: SimulatorState = {};
	private static behaviors: MainBehaviors = {
		and: (a, b) => a & b,
		or: (a, b) => a | b,
		xor: (a, b) => a ^ b,
		buffer: (a) => a,
		not: (a) => ~a & 1,
	} as MainBehaviors;

	constructor(private components: ComponentsMap<T>) { }

	getState(): SimulatorState {
		return this.state;
	}

	getComponent(componentId: string): Component<T> {
		const comp = this.components[componentId];
		if (!comp) throw new Error(`Component with id '${componentId}' is not defined`);
		return comp;
	}

	getComponentState(componentId: string): Bit {
		const comp = this.getComponent(componentId);
		let state: Bit | undefined = this.state[componentId];

		if (state === undefined) {
			let inputs: Bit[] = comp.inputs.map((input) => {
				if (typeof input === 'number') return input as Bit;
				return this.getComponentState(input as string);
			});

			state = (
				LogicCircuit.behaveAs as (n: keyof T, ...i: Bit[]) => Bit
			)(comp.behavior, ...inputs);
			this.state[componentId] = state!;
		}

		return state!;
	}

	static behaveAs<T extends MainBehaviors, K extends keyof T>(
		behaviorName: K, ...inputs: Parameters<T[K]>
	): Bit {
		if (!(LogicCircuit.behaviors as T)[behaviorName])
			throw new Error(`Behavior '${behaviorName as string}' is not defined`);
		const behavior = this.behaviors[behaviorName] as (...inputs: Bit[]) => Bit;
		return behavior(...inputs);
	}

	static defineBehavior<T extends MainBehaviors, K extends keyof T>(
		name: K,
		behavior: (inputs: Parameters<T[K]>, behave: BehaveAsFunction<T, K>) => Bit,
	) {
		const customBehavior: Behavior = (...inputs: Bit[]) =>
			behavior(inputs as Parameters<T[K]>, LogicCircuit.behaveAs.bind(this));
		(LogicCircuit.behaviors as T)[name] = customBehavior as T[K];
	}

	updateState() {
		Object.keys(this.components).forEach(this.getComponentState.bind(this));
	}

	testBehavior<K extends keyof T>(behaviorName: K, inputsCount: number) {
		const results: BehaviorTestResult<T, K>[] = [];
		let allInputs: Bit[][] = Array<Bit[]>(Math.pow(2, inputsCount))
			.fill([0])
			.map((_, index) => index
				.toString(2)
				.padStart(inputsCount, '0')
				.split('')
				.map(v => parseInt(v) as Bit));

		for (const inputs of allInputs) {
			const state = LogicCircuit.behaveAs<T, K>(behaviorName, ...inputs as Parameters<T[K]>);
			results.push({ inputs: inputs as Parameters<T[K]>, state });
		}

		return results;
	}

	get pins(): string[] {
		return Object.keys(this.components).filter((c) => this.components[c].pin !== undefined);
	}

	get outputPins(): string[] {
		return this.pins.filter((c) => this.components[c].pin === 'output');
	}

	get inputPins(): string[] {
		return this.pins.filter((c) => this.components[c].pin === 'input');
	}

	execute(...inputs: Bit[]): Bit[] {
		const pins = this.inputPins;
		if (inputs.length !== pins.length)
			throw new Error(`This circuit requires ${pins.length} input pins`);
		pins.forEach((name, index) => this.state[name] = inputs[index]);
		this.updateState();
		return this.outputPins.map((name) => this.state[name]);
	}
}

