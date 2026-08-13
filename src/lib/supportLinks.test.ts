import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachSupportLinksFromPrompt } from "./supportLinks";
import type { Exercise } from "./types";

function ex(id: string, name: string, nameEn: string): Exercise {
  return {
    id,
    order: 0,
    name,
    nameEn,
    badge: "",
    intro: "",
    dose: { setsReps: "3x10" },
    purpose: "",
    muscles: [],
    steps: [],
    commonMistakes: [],
    benefit: "",
    sketchCaption: "",
  };
}

describe("attachSupportLinksFromPrompt — URL belongs to the nearest name", () => {
  it("does not give the bear-plank short to the incline press above it", () => {
    const exercises = [
      ex(
        "press",
        "Press de pecho inclinado con mancuernas",
        "Incline Dumbbell Press",
      ),
      ex("bear", "Bear plank", "Bear plank"),
    ];
    const prompt = `
Press de pecho inclinado con mancuernas (Incline Dumbbell Press)
3 series. Banco inclinado, mancuernas al pecho, press.
Bear plank
https://www.youtube.com/shorts/nGSFAjjf9oI
`;
    const next = attachSupportLinksFromPrompt(exercises, prompt);
    const press = next.find((e) => e.id === "press");
    const bear = next.find((e) => e.id === "bear");
    assert.equal(
      bear?.supportLinks?.[0]?.url,
      "https://www.youtube.com/shorts/nGSFAjjf9oI",
    );
    assert.notEqual(
      press?.supportLinks?.[0]?.url,
      "https://www.youtube.com/shorts/nGSFAjjf9oI",
    );
  });
});
