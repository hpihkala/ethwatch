import { LogDescription } from "ethers/lib/utils";
import { RawEvent } from "./RawEvent";

export type EventState = {
	raw: RawEvent
	parsed: LogDescription
	confirmations: Set<string>
	timeout: ReturnType<typeof setTimeout>
}