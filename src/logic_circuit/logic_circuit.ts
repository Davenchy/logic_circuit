import BehaviorManager from "./behavior_manager";
import {
	ILogicCircuit,
	CircuitComponentsConfig,
	State,
	IBehaviorManager,
	BehaviorDefinition,
	CircuitState,
	InputStateMap,
	BehaviorName,
	BehaviorParams,
	ComponentId,
} from "./types";

// !TODO: find solution for feedback components
export default class LogicCircuit<
	Config extends CircuitComponentsConfig = CircuitComponentsConfig,
> implements ILogicCircuit<Config>
{
	protected state: CircuitState<Config> = {} as CircuitState<Config>;

	constructor(protected config: Config) { }

	getName(): string {
		return this.config.name;
	}

	getInputs(): string[] {
		return Array.from(this.config.inputs);
	}

	getOutputs(): string[] {
		return Array.from(this.config.outputs);
	}

	getConfig(): Config {
		// !TODO: check if modified components affect the config or not
		return { ...this.config };
	}

	private behaveAs(
		behavior: string | BehaviorDefinition<BehaviorName>,
		inputs: State[],
	): State {
		const manager: IBehaviorManager = BehaviorManager.getInstance();
		if (typeof behavior === 'string')
			return manager.behaveAs(
				behavior as BehaviorName,
				...inputs as BehaviorParams<BehaviorName>
			);
		else if (typeof behavior === 'function')
			return (<Function>behavior)(...inputs);
		throw new Error(
			`behavior must be a behavior name or a behavior definition function: ${typeof behavior}`,
		);
	}

	private evaluateInputs(inputs: (State | ComponentId<Config>)[]): State[] {
		return inputs.map(
			(i) => typeof i === 'string' ? this.getComponentState(i) : i as State,
		);
	}

	private getComponentState(componentId: ComponentId<Config>): State {
		// check if component state is already calculated
		if (this.state[componentId] !== undefined)
			return this.state[componentId]!;

		// try to get component config
		const comp = this.config.components[componentId as string];
		if (!comp)
			throw new Error(
				`component with id '${componentId as string}' not defined`
			);

		// set default state to off
		this.state[componentId] = 0;

		// calculate component inputs
		const inputs = this.evaluateInputs(comp.inputs);

		// calculate component state
		const state = this.behaveAs(comp.behavior, inputs);

		// cache component state for next calls
		this.state[componentId] = state;

		return state;
	}

	getState(inputs: InputStateMap): CircuitState<Config> {
		// reset circuit states
		this.resetState();

		// validate inputs
		if (!this.config.inputs.every((id) => inputs[id] !== undefined))
			throw new Error(
				`All circuit inputs must be defined:\nInputs: ${Object.keys(inputs).join(', ')}, Required: ${this.config.inputs.join(', ')}`);

		// set input states
		(Object.entries(inputs) as [ComponentId<Config>, State][])
			.forEach(([id, S]) => this.state[id] = S);

		// calculate output states
		// !FIX: return outputs state instead of circuit state
		return (this.config.outputs as ComponentId<Config>[]).reduce(
			(s, id) => ({ ...s, [id]: this.getComponentState(id) }),
			{} as CircuitState<Config>,
		);
	}

	resetState(): void {
		this.state = {} as CircuitState<Config>;
	}

	clone(): ILogicCircuit<Config> {
		return new LogicCircuit(this.config);
	}
}
