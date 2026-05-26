import { MOCK_AI_FLOW } from './mockAiFlow';
import type { AiFlowResponse } from './types';

/** Example user message shown in the floating chat simulation. */
export const DEMO_USER_MESSAGE =
    'Fill up my working hours, I worked from 9 to 1800 from Monday until Friday except Tuesday I left 1700';

/**
 * System instruction: teach the model to return a react-flowcase `FlowStep[]`
 * your app passes to `runFlow`.
 */
export const SYSTEM_INSTRUCTION_PROMPT = `You are a UI automation assistant for a React app using react-flowcase.

The user describes what to do in natural language. Respond with ONLY valid JSON — no markdown fences, no prose.

Schema:
{
  "flow": FlowStep[]
}

Each FlowStep is one of (JSON-serializable fields only — no functions):

• { "type": "input", "element": "#css-id", "value": "text", "charDelayMs"?: number, "append"?: boolean }
• { "type": "click", "element": "#css-id", "wait"?: true | false | number }
• { "type": "select", "element": "#css-id", "value": "optionValue" }
• { "type": "delay", "duration": number }
• { "type": "waitFor", "element": "#css-id", "state"?: "visible" | "enabled" | "attached", "timeout"?: number }
• { "type": "hover", "element": "#css-id", "duration"?: number }
• { "type": "keypress", "key": "Enter", "element"?: "#css-id", "modifiers"?: ["shift"|"ctrl"|"alt"|"meta"] }
• { "type": "scroll", "element": "#css-id", "block"?: "start" | "center" | "end" }

Rules:
- "element" must be a CSS selector string matching an id on the page (see DOM map below).
- Prefer "input" steps to fill fields; use "click" only for buttons.
- Normalize times to "HH:MM" (e.g. "1800" → "18:00").
- Expand weekday ranges into one input step per field.

Working hours form — available selectors:
  #wh-monday-start, #wh-monday-end, #wh-monday-notes
  #wh-tuesday-start, #wh-tuesday-end, #wh-tuesday-notes
  #wh-wednesday-start, #wh-wednesday-end, #wh-wednesday-notes
  #wh-thursday-start, #wh-thursday-end, #wh-thursday-notes
  #wh-friday-start, #wh-friday-end, #wh-friday-notes
  #wh-saturday-start, #wh-saturday-end, #wh-saturday-notes
  #wh-sunday-start, #wh-sunday-end, #wh-sunday-notes`;

export const MOCK_AI_FLOW_RESPONSE: AiFlowResponse = {
    flow: MOCK_AI_FLOW,
};

export const WEEKDAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

export type WeekdayId = (typeof WEEKDAYS)[number];

export function fieldId(day: WeekdayId, field: 'start' | 'end' | 'notes'): string {
    return `wh-${day}-${field}`;
}
