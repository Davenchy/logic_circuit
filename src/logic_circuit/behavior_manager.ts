import {
	BehaviorDefinition,
	BehaviorName,
	BehaviorParams,
	BehaviorValue,
	IBehaviorManager,
	IBehaviorMap,
	State
} from './types';

export type BehaviorMultiDefinitionsMap = {
	[Name in BehaviorName]: BehaviorDefinition<Name>;
};

export default class BehaviorManager implements IBehaviorManager {

	private static instance: BehaviorManager;
	private behaviorMap: IBehaviorMap = {
		and: (a, b) => (a & b) & 1,
		or: (a, b) => (a | b) & 1,
		xor: (a, b) => (a ^ b) & 1,
		not: (a) => ~a & 1,
		buffer: (a) => a & 1,
	} as IBehaviorMap;

	static getInstance(): BehaviorManager {
		if (!BehaviorManager.instance)
			BehaviorManager.instance = new BehaviorManager();
		return BehaviorManager.instance;
	}

	defineBehavior<N extends BehaviorName>(
		behaviorName: N,
		definition: BehaviorDefinition<N>,
	): void {
		this.behaviorMap[behaviorName] = ((...inputs: BehaviorParams<N>) =>
			definition(inputs, this.behaveAs.bind(this))) as BehaviorValue<N>;
	}

	defineMultiBehaviors(definitions: BehaviorMultiDefinitionsMap): void {
		Object.entries(definitions).forEach(([behaviorName, definition]) => {
			this.defineBehavior(behaviorName as BehaviorName, definition);
		});
	}

	getBehavior<N extends BehaviorName>(behaviorName: N): BehaviorValue<N> {
		if (!this.behaviorMap[behaviorName])
			throw new Error(`Behavior '${behaviorName as string}' not defined`);
		return this.behaviorMap[behaviorName]!;
	}

	behaveAs<N extends BehaviorName>(
		behaviorName: N, ...inputs: BehaviorParams<N>
	): State {
		const behavior = this.getBehavior(behaviorName) as Function;
		return behavior(...inputs);
	}
}
