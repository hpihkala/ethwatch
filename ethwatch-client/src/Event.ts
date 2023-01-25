import { LogDescription } from "ethers/lib/utils";
import { ParsedEvent } from "./ParsedEvent";
import { RawEvent } from "./RawEvent";

export type Event = {
	raw: RawEvent
	parsed: ParsedEvent
	confirmations: Set<string>
	requiredConfirmations: number
	totalSeedNodes: number
	accepted: boolean
}