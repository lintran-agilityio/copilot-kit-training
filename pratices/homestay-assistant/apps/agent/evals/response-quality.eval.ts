import { evalite } from "evalite";

import { gradeAgainstRubric } from "./support/judge";
import { runCase, type CaseResult } from "./support/run-case";

/**
 * LLM-as-judge, used ONLY for the natural-language quality of the reply —
 * every structural claim (which tool ran, what arguments it got, whether a
 * mutation fired) is asserted deterministically elsewhere in this suite.
 * Each rubric line is a single literal, independently-checkable claim (see
 * `support/judge.ts`) rather than an open "does this look good" — the
 * things listed in the brief (doesn't invent info, doesn't claim an
 * unavailable room is available, asks for missing info, is concise) map
 * directly onto per-case rubric lines below.
 *
 * ⚠️ KNOWN FAILING (all 5 cases, as of writing) — a real, systematic
 * finding, not a judge bug: every observed reply appends a second
 * boilerplate closer ("Let me know if you need help!" / "Feel free to
 * ask!") after its substantive sentence, so the "single short sentence"
 * rubric line fails every time. `intent-playbook.ts`'s GENERIC_UI_RENDERING
 * section is explicit — "emit exactly ONE very short plain sentence...
 * Never use a tools-only response" — with worked examples that contain no
 * such closer. This looks like a general model/prompt habit, not something
 * confined to one workflow. Verified by inspecting the judge's per-case
 * reasoning (temporarily logged during triage) — it correctly quotes the
 * two-sentence structure as the failure in every case. Left failing on
 * purpose to document the gap; do not loosen the rubric to pass it.
 */
type QualityCase = {
  name: string;
  message: string;
  rubric: string[];
};

const cases: QualityCase[] = [
  {
    name: "missing guests/dates — must not invent them",
    message: "I want to book the Riverside Twin Room",
    rubric: [
      "The reply does not state a specific guest count as already decided.",
      "The reply does not state specific check-in/check-out dates as already decided.",
      "The reply does not claim the booking is confirmed, created, or already made.",
      "The reply is a single short sentence (not a paragraph, not a list).",
    ],
  },
  {
    name: "requested dates overlap an existing booking — must not claim availability",
    message: "Book the Riverside Twin Room for 2 guests on October 6, one night",
    rubric: [
      "The reply does not say the room is available for the requested dates.",
      "The reply does not claim the booking was confirmed or created.",
      "The reply is a single short sentence (not a paragraph, not a list).",
    ],
  },
  {
    name: "no-op modify — must communicate nothing changed, not ask follow-ups",
    message: "Change the guest count on my Riverside Twin Room booking to 2",
    rubric: [
      "The reply states that the booking already has the requested details (guests are already 2), OR is a very short acknowledgement to that effect.",
      "The reply does not ask what else the guest would like to change.",
      "The reply does not offer alternative dates, rooms, or guest counts.",
      "The reply is a single short sentence.",
    ],
  },
  {
    name: "no matching bookings for the asked date — must not invent one",
    message: "Do I have any bookings for December 25?",
    rubric: [
      "The reply says there are no matching bookings for that date, or equivalent.",
      "The reply does not name a specific room, date, or guest count as if a booking exists.",
      "The reply does not invent a booking id.",
    ],
  },
  {
    // KNOWN FAILING — see tool-selection.eval.ts's file-header note on the
    // same underlying gap. `WORKFLOW_FIND`/`WORKFLOW_DETAIL` both forbid
    // restating amenities/description/price in chat text (the UI card owns
    // that data) — a live run was observed doing exactly this. Left failing
    // on purpose to document the gap; do not loosen the rubric to pass it.
    name: "amenities question — UI owns room facts, chat must not list them (KNOWN FAILING)",
    message: "What amenities does the Riverside Twin Room have?",
    rubric: [
      "The reply does not list specific amenities (e.g. WiFi, air conditioning, river view) in the chat text.",
      "The reply is a single short sentence pointing at the room card/detail view, not a description of the room.",
    ],
  },
];

evalite<QualityCase, CaseResult, string[]>(
  "Response quality — rubric-graded replies",
  {
    data: () => cases.map((c) => ({ input: c, expected: c.rubric })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Passes rubric",
        description:
          "Every rubric line must hold — see support/judge.ts for the grading contract.",
        scorer: async ({ input, output, expected }) => {
          const verdict = await gradeAgainstRubric({
            userMessage: input.message,
            assistantReply: output.text,
            rubric: expected!,
          });
          return {
            score: verdict.pass ? 1 : 0,
            metadata: {
              reason: verdict.reason,
              failedRules: verdict.failedRules,
            },
          };
        },
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      { label: "Reply", value: output.text.slice(0, 300) },
    ],
  },
);
