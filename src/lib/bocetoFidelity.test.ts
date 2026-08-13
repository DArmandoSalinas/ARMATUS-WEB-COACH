import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVisualBrief,
  shouldExcludePullingReferences,
} from "./bocetoBrief";
import {
  briefFidelityError,
  classifyLift,
  coachingConflictsWithLift,
  imagePromptFidelityError,
  libraryAssetConflictsWithLift,
  shouldSkipCharacterReferences,
} from "./bocetoFidelity";
import { resolveBocetoKey, resolveBocetoPath } from "./bocetoMatch";
import { buildBocetoImagePrompt } from "./prompts";
import type { BocetoPromptContext } from "./bocetoBrief";

function brief(partial: Partial<BocetoPromptContext> & Pick<BocetoPromptContext, "name">) {
  return buildVisualBrief({
    sketchCaption: partial.sketchCaption || "",
    ...partial,
  });
}

describe("classifyLift — title only", () => {
  it("machine shoulder press is a seated vertical push, not a row or rotation", () => {
    const cls = classifyLift(
      "PRESS DE HOMBRO EN MAQUINA",
      "SHOULDER PRESS MACHINE",
    );
    assert.equal(cls.kind, "shoulder-press");
    assert.equal(cls.movement, "vertical-push");
    assert.equal(cls.equipment, "machine");
  });

  it("does not treat bare 'hombro' / 'shoulder' as cuff rotation", () => {
    assert.equal(
      classifyLift("Press de hombro con mancuernas", "Dumbbell shoulder press")
        .kind,
      "shoulder-press",
    );
    assert.equal(
      classifyLift("Rotación externa de hombro con liga").kind,
      "shoulder-rotation",
    );
  });

  it("rows, pulldowns and pull-ups stay pulls", () => {
    assert.equal(classifyLift("Remo sentado en polea").kind, "row");
    assert.equal(classifyLift("Jalón al pecho", "Lat pulldown").kind, "pulldown");
    assert.equal(classifyLift("Dominadas", "Pull-ups").kind, "pullup");
  });
});

describe("buildVisualBrief — press must never be a row", () => {
  const machinePressIntro =
    "El press de hombro en máquina es un ejercicio que fortalece los músculos deltoides y tríceps. La máquina proporciona estabilidad, permitiendo un enfoque seguro para principiantes. Similar a una rotación de hombro o un remo, el atleta controla el movimiento.";

  it("PRESS DE HOMBRO EN MAQUINA draws a seated machine press", () => {
    const b = brief({
      name: "PRESS DE HOMBRO EN MAQUINA",
      nameEn: "SHOULDER PRESS MACHINE",
      intro: machinePressIntro,
      sketchCaption: "Vista técnica",
    });
    assert.equal(
      briefFidelityError(
        b,
        classifyLift("PRESS DE HOMBRO EN MAQUINA", "SHOULDER PRESS MACHINE"),
      ),
      null,
    );
    assert.match(b.equipment, /SHOULDER PRESS MACHINE/i);
    assert.match(b.movementPattern, /VERTICAL PUSH/i);
    assert.match(b.bodyPosition, /SEATED/i);
    assert.doesNotMatch(b.equipment, /liga elástica for standing/i);
    assert.equal(shouldExcludePullingReferences(b), true);
  });

  it("English-only Shoulder Press Machine does not reuse barbell overhead art", () => {
    const name = "Shoulder Press Machine";
    assert.equal(resolveBocetoPath(name), null);
    assert.equal(resolveBocetoKey(name), null);
    const b = brief({ name });
    assert.match(b.equipment, /SHOULDER PRESS MACHINE/i);
    assert.equal(
      briefFidelityError(b, classifyLift(name)),
      null,
    );
  });

  it("intro mentioning rotación/remo cannot override a press title", () => {
    const b = brief({
      name: "Press de hombro en máquina",
      intro: "rotación externa de hombro. remo sentado. polea. banda.",
    });
    assert.match(b.equipment, /PRESS MACHINE/i);
    assert.match(b.movementPattern, /VERTICAL PUSH/i);
  });

  it("dumbbell shoulder press is two dumbbells going up, not a barbell or row", () => {
    const b = brief({
      name: "Press de hombro con mancuernas",
      nameEn: "Dumbbell shoulder press",
    });
    assert.match(b.equipment, /dumbbell/i);
    assert.doesNotMatch(b.equipment, /olympic bar/i);
    assert.match(b.movementPattern, /VERTICAL PUSH/i);
    assert.equal(resolveBocetoKey("Press de hombro con mancuernas"), null);
  });

  it("chest press machine is a forward push, not a seated row", () => {
    const b = brief({
      name: "Press de pecho en máquina",
      nameEn: "Chest press machine",
    });
    assert.match(b.equipment, /CHEST PRESS MACHINE/i);
    assert.match(b.movementPattern, /PUSH/i);
    assert.equal(
      briefFidelityError(b, classifyLift("Press de pecho en máquina", "Chest press machine")),
      null,
    );
  });
});

describe("buildVisualBrief — other patterns stay themselves", () => {
  it("band external rotation is a band, not a press", () => {
    const b = brief({
      name: "Rotación externa de hombro con liga",
      sketchCaption: "De pie, codo a 90",
    });
    assert.match(b.equipment, /liga elástica|resistance band/i);
    assert.doesNotMatch(b.equipment, /PRESS MACHINE/i);
    assert.equal(shouldExcludePullingReferences(b), false);
  });

  it("seated cable row is a pull", () => {
    const b = brief({
      name: "Remo sentado en polea",
      nameEn: "Seated cable row",
    });
    assert.match(b.movementPattern, /PULL/i);
    assert.doesNotMatch(b.movementPattern, /VERTICAL PUSH/i);
  });

  it("lat pulldown is a machine pulldown, not a hanging pull-up", () => {
    const b = brief({
      name: "Jalón al pecho",
      nameEn: "Lat pulldown",
    });
    assert.match(b.equipment, /lat pulldown/i);
    assert.doesNotMatch(b.equipment, /pull-up bar bodyweight/i);
    assert.equal(resolveBocetoKey("Jalón al pecho"), "latpulldown");
  });

  it("pec-deck machine is arm pads, not cable fly", () => {
    const b = brief({
      name: "Aperturas en máquina",
      nameEn: "Pec deck",
    });
    assert.match(b.equipment, /pec-deck/i);
    assert.match(b.equipment, /NOT cable towers/i);
  });

  it("90/90 hip switch is floor work, not a cable row", () => {
    const b = brief({
      name: "Cambio de cadera 90/90",
      nameEn: "90/90 hip switch",
      intro: "Movilidad de cadera en el suelo.",
    });
    assert.doesNotMatch(b.equipment, /cable row|D-handle/i);
  });
});

describe("library assets cannot cross movement families", () => {
  it("machine / DB shoulder press never resolve to row, pullup, pulldown, or rotation art", () => {
    const names = [
      ["PRESS DE HOMBRO EN MAQUINA", "SHOULDER PRESS MACHINE"],
      ["Press de hombro con mancuernas", "Dumbbell shoulder press"],
      ["Shoulder Press Machine", null],
    ] as const;
    for (const [name, nameEn] of names) {
      const key = resolveBocetoKey(name, { nameEn });
      assert.equal(key, null, `${name} should not reuse a library JPG (got ${key})`);
      const cls = classifyLift(name, nameEn);
      for (const pull of [
        "row",
        "uprightrow",
        "facepull",
        "invertedrow",
        "pullup",
        "latpulldown",
        "externalrotation",
      ]) {
        assert.equal(
          libraryAssetConflictsWithLift(pull, cls),
          true,
          `${name} vs ${pull}`,
        );
      }
    }
  });

  it("barbell military press may use overhead art; pulldown must not use pullup art", () => {
    assert.equal(resolveBocetoKey("Press militar"), "overhead");
    assert.equal(resolveBocetoKey("Jalón al pecho", { nameEn: "Lat pulldown" }), "latpulldown");
    assert.notEqual(resolveBocetoKey("Jalón al pecho"), "pullup");
    assert.equal(resolveBocetoKey("Dominadas"), "pullup");
    assert.notEqual(resolveBocetoKey("Dominadas"), "latpulldown");
  });

  it("pec-deck / machine fly does not steal standing cable-fly art", () => {
    assert.equal(resolveBocetoKey("Aperturas en máquina", { nameEn: "Pec deck" }), null);
  });

  it("single-arm dumbbell row does not steal barbell-row art", () => {
    assert.equal(resolveBocetoKey("Remo con mancuerna a una mano"), null);
  });
});

describe("image generation lock — press cannot be prompted as a row", () => {
  it("skips character-reference poses for machine / shoulder press", () => {
    const machine = classifyLift(
      "PRESS DE HOMBRO EN MAQUINA",
      "SHOULDER PRESS MACHINE",
    );
    const db = classifyLift("Press de hombro con mancuernas");
    const row = classifyLift("Remo sentado en polea");
    assert.equal(shouldSkipCharacterReferences(machine), true);
    assert.equal(shouldSkipCharacterReferences(db), true);
    assert.equal(shouldSkipCharacterReferences(row), false);
  });

  it("HARD LOCK is first; intro about remo/rotación never reaches the illustrator", () => {
    const intro =
      "El press de hombro en máquina fortalece deltoides. Similar a una rotación de hombro o un remo sentado en polea.";
    const prompt = buildBocetoImagePrompt({
      name: "PRESS DE HOMBRO EN MAQUINA",
      nameEn: "SHOULDER PRESS MACHINE",
      sketchCaption: "Máquina de press, empuje vertical; NO remo",
      intro,
      purpose: intro,
      steps: [
        { title: "Tira", body: "Remo sentado, lleva las manijas al pecho." },
        { title: "Empuja", body: "Extiende los brazos arriba sobre la cabeza." },
      ],
    });
    const cls = classifyLift(
      "PRESS DE HOMBRO EN MAQUINA",
      "SHOULDER PRESS MACHINE",
    );
    assert.equal(imagePromptFidelityError(prompt, cls), null);
    const lockIdx = prompt.indexOf("HARD LOCK");
    const charIdx = prompt.indexOf("CHARACTER / STYLE");
    assert.ok(lockIdx >= 0 && lockIdx < charIdx);
    assert.match(prompt, /SILENT SKETCH|ZERO letters/i);
    assert.match(prompt, /UPRIGHT|ear height|elbows ~90/i);
    assert.doesNotMatch(prompt, /\nINTRO:/);
    assert.doesNotMatch(prompt, /\nCAPTION:/);
    assert.doesNotMatch(prompt, /\nTECHNIQUE STEPS:/);
    assert.doesNotMatch(prompt, /PRESS DE HOMBRO EN MAQUINA/);
    assert.doesNotMatch(prompt, /Similar a una rotación/);
    assert.doesNotMatch(prompt, /Tira: Remo sentado/);
    assert.doesNotMatch(prompt, /Empuja: Extiende/);
  });

  it("keeps a caption that only forbids remo, drops a caption that is a row", () => {
    const cls = classifyLift("Press de hombro en máquina");
    assert.equal(
      coachingConflictsWithLift("Máquina de press; NO remo", cls),
      false,
    );
    assert.equal(
      coachingConflictsWithLift("Remo sentado en polea al pecho", cls),
      true,
    );
  });
});
