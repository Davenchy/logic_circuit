export type State = 0 | 1;

export type CircuitComponentInput = [string | State] | [string | State, string | State];

export interface CircuitComponent<N extends BehaviorName> {
	inputs: BehaviorParams<N> | CircuitComponentInput;
	behavior: N | BehaviorDefinition<any>;
}

export interface CircuitComponentsConfig {
	name: string;
	inputs: string[];
	outputs: string[];
	components: {
		[id: string]: CircuitComponent<BehaviorName>;
	};
}

export type ComponentId<Config extends CircuitComponentsConfig> = keyof Config['components'];
export type InputStateMap = { [id: string]: State };
export type CircuitState<C extends CircuitComponentsConfig> = {
	[id in ComponentId<C>]: State
};

export interface ILogicCircuit<
	Config extends CircuitComponentsConfig = CircuitComponentsConfig,
> {
	getName(): string;
	getInputs(): string[];
	getOutputs(): string[];
	getConfig(): Config;

	getState(inputs: InputStateMap): CircuitState<Config>;
	resetState(): void;

	clone(): ILogicCircuit<Config>;
}

export interface IBehaviorMap {
	and: DualBehavior;
	or: DualBehavior;
	xor: DualBehavior;
	buffer: SingleBehavior;
	not: SingleBehavior;
}

export type BehaviorName = keyof IBehaviorMap;
export type BehaviorValue<N extends BehaviorName> = IBehaviorMap[N];
export type BehaviorParams<N extends BehaviorName> = Parameters<BehaviorValue<N>>;

export type SingleBehavior = (state: State) => State;
export type DualBehavior = (state1: State, state2: State) => State;
export type Behavior = SingleBehavior | DualBehavior;

export type BehaviorBehaveFunction<N extends BehaviorName> =
	(behaviorName: N, ...inputs: Parameters<BehaviorValue<N>>) => State;

export type BehaviorDefinition<N extends BehaviorName> = (
	inputs: Parameters<BehaviorValue<N>>,
	behaveAs: BehaviorBehaveFunction<N>,
) => State;

export interface IBehaviorManager {
	defineBehavior<N extends BehaviorName>(
		behaviorName: N, definition: BehaviorDefinition<N>): void;

	defineMultiBehaviors(
		definitions: { [N in BehaviorName]: BehaviorDefinition<N>; }): void;

	getBehavior<N extends BehaviorName>(behaviorName: N): BehaviorValue<N>;

	behaveAs<N extends BehaviorName>(behaviorName: N, ...inputs: BehaviorParams<N>): State;
}
