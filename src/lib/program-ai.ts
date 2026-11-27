import "server-only";

import Groq from "groq-sdk";
import {
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  generatedProgramSchema,
  normalizeGeneratedProgram,
  type GeneratedProgram,
  type ProgramRequest,
} from "@/lib/program-schema";

const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MAX_COMPLETION_TOKENS = 4000;

export class ProgramAiError extends Error {}

const SYSTEM_PROMPT = `You are an experienced strength and conditioning coach building
a practical, progressive training program for one person.

Rules:
- Use only the equipment the person has. Never prescribe lifts that need
  unavailable equipment.
- Every training day gets 3-8 exercises with a clear set x rep target, e.g.
  "4 x 6", "3 x 10 each leg", "3 x 30 sec". Activity days (practice, match,
  conditioning class) have no exercises.
- Weekday numbers: 1 = Monday through 7 = Sunday. Spread training days so
  hard days are not back-to-back when possible.
- The weekly target is the number of sessions that count toward the goal.
  Match days count toward the target only if the person asked for matches.
- Set skipInMatchWeek true for training days that should be dropped in a match
  week (typically the heaviest day). A match day has isMatch true and
  countsTowardTarget false.
- Suggest 2-6 trackable metrics with realistic units and directions.
- Keep names short. No medical advice, no diet plans, no supplements.

Respond with a single JSON object and nothing else, shaped exactly like:
{
  "name": "short program name",
  "summary": "2-3 sentences on the approach and weekly rhythm",
  "weeklyTarget": 4,
  "dayTypes": [
    {
      "name": "Day 1 - Lower body",
      "kind": "TRAINING",
      "plannedWeekdays": [1],
      "isMatch": false,
      "skipInMatchWeek": false,
      "countsTowardTarget": true,
      "exercises": [
        { "name": "Goblet squat", "targetText": "4 x 8" }
      ]
    }
  ],
  "metrics": [
    {
      "name": "Back squat",
      "unit": "kg",
      "direction": "HIGHER_IS_BETTER",
      "decimals": 1,
      "targetMin": null,
      "targetMax": null
    }
  ]
}`;

function buildUserPrompt(input: ProgramRequest): string {
  return [
    `Goal: ${input.goal}`,
    `Available training days per week: ${input.daysPerWeek}`,
    `Equipment: ${EQUIPMENT_LABELS[input.equipment]}`,
    `Experience: ${EXPERIENCE_LABELS[input.experience]}`,
    input.notes ? `Additional context: ${input.notes}` : "",
    `Use at most ${input.daysPerWeek} training days.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function parseProgram(content: string): GeneratedProgram {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new ProgramAiError("The AI returned data we could not read.");
  }

  const parsed = generatedProgramSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ProgramAiError("The AI returned a program that was not valid.");
  }
  return normalizeGeneratedProgram(parsed.data);
}

/**
 * Generates a program draft with Groq. Throws ProgramAiError with a message
 * that is safe to show to the user.
 */
export async function generateProgram(
  input: ProgramRequest,
): Promise<GeneratedProgram> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ProgramAiError(
      "AI program building is not configured. Add GROQ_API_KEY to the server environment.",
    );
  }

  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(input) },
  ];

  let lastContent = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.4,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        response_format: { type: "json_object" },
      });
    } catch (error) {
      console.error("Groq program generation failed", error);
      throw new ProgramAiError(
        "The AI service is unavailable right now. Please try again.",
      );
    }

    lastContent = completion.choices[0]?.message?.content ?? "";
    if (!lastContent) {
      throw new ProgramAiError("The AI returned an empty program.");
    }

    try {
      return parseProgram(lastContent);
    } catch (error) {
      if (!(error instanceof ProgramAiError) || attempt === 1) throw error;
      // One repair attempt: show the model its own output and ask again.
      messages.push(
        { role: "assistant", content: lastContent },
        {
          role: "user",
          content:
            "That JSON did not match the required shape (all keys present, weekday numbers 1-7, sets x reps targets). Return only corrected JSON.",
        },
      );
    }
  }

  throw new ProgramAiError("The AI returned a program that was not valid.");
}
