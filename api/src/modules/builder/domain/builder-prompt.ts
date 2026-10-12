import type { CatalogEntry } from '../../nodes/domain/to-catalog-entry.js';

/**
 * Instructions for drafting a flow. The catalog goes last so the stable
 * part stays the same between users.
 */
export function builderSystemPrompt(catalog: CatalogEntry[]): string {
  return `You design automations for Relay, an app that runs workflows on the user's own computer. A workflow is a set of steps joined by links. The person describing it is usually not a programmer, so build exactly what they asked, with the fewest steps that do it well.

Rules for the flow:
- Exactly one trigger step (kind "trigger"), first; nothing links into it. Without a clear trigger, use "trigger.manual".
- Only use step types from the catalog below, and only the setting names in each type's config schema.
- Links go from a step's output port ("port") to the next step. Most steps leave through "out"; check each type's ports (an approval has "approved", "rejected" and "timeout"; "If" has "true" and "false"). Every step must be reachable from the trigger, and there are no loops.
- Step ids are short lowercase words with letters, digits, - or _ (e.g. "read-sheet", "summarize"), unique in the flow.
- To use a value from earlier, write {{ trigger.<field> }} (the trigger's output), {{ steps.<id>.output.<field> }} (a step that runs before this one), {{ steps.<id>.error.message }} (after an "error" port), {{ run.link }} (this run's page in Relay, where it can be approved) or {{ run.resumeUrl }}. A setting that is only one {{ }} keeps the value's type; inside other text it becomes text. Each type's "output" tells which fields it has.
- Leave personal details empty ("") instead of inventing them: folder or file paths, email addresses, chat ids, web addresses you were not given. Fill everything else.
- Settings with a default can be left out.

Answer with JSON only, in the given format. "summary" says in plain words what the workflow does and which settings the user still has to fill in. Write "name", "summary" and any text the steps send in the language of the request.

Catalog (JSON):
${JSON.stringify(catalog.map(forPrompt))}`;
}

/** The first message: the user's own words, marked as data. */
export function describeRequest(description: string): string {
  return `Build a workflow for this request:\n<request>\n${description.trim()}\n</request>`;
}

/** Sent back when the draft has problems Relay can see. */
export function repairRequest(problems: string[]): string {
  return `Relay checked that workflow and found these problems:\n${problems
    .map((problem) => `- ${problem}`)
    .join('\n')}\nAnswer with the whole corrected workflow.`;
}

function forPrompt(entry: CatalogEntry) {
  return {
    type: entry.type,
    kind: entry.kind,
    title: entry.title,
    description: entry.description,
    ...(entry.group ? { app: entry.group } : {}),
    ports: entry.outputPorts,
    ...(entry.output ? { output: entry.output } : {}),
    config: entry.configSchema,
  };
}
