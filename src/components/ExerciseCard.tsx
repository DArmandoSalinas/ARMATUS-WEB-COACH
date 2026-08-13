"use client";

import { useState } from "react";
import { tx } from "@/lib/i18n";
import type { Exercise, SupportLink } from "@/lib/types";
import { useLocale } from "./LocaleToggle";

function musclesToText(muscles: string[]): string {
  return muscles.join(", ");
}

function textToMuscles(text: string): string[] {
  return text
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function linksToText(links: SupportLink[] | undefined): string {
  return (links ?? [])
    .map((l) => (l.label ? `${l.label} | ${l.url}` : l.url))
    .join("\n");
}

function textToLinks(text: string): SupportLink[] | undefined {
  const lines = text.split("\n");
  const supportLinks = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const pipe = line.indexOf("|");
      if (pipe >= 0) {
        const label = line.slice(0, pipe).trim();
        const url = line.slice(pipe + 1).trim();
        return label ? { label, url } : { url };
      }
      return { url: line };
    })
    .filter((l) => /^https?:\/\//i.test(l.url));
  return supportLinks.length ? supportLinks : undefined;
}

type ExerciseCardProps = {
  exercise: Exercise;
  index: number;
  editable?: boolean;
  busy?: { text?: boolean; image?: boolean };
  onChange?: (patch: Partial<Exercise>) => void;
  onReorder?: (direction: "up" | "down") => void;
  onRegenerateText?: () => void;
  onRegenerateImage?: () => void;
  onRemove?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

export function ExerciseCard({
  exercise,
  index,
  editable = false,
  busy,
  onChange,
  onReorder,
  onRegenerateText,
  onRegenerateImage,
  onRemove,
  isFirst,
  isLast,
}: ExerciseCardProps) {
  const locale = useLocale();
  const doseMeta = [exercise.dose.rpe, exercise.dose.rest]
    .filter(Boolean)
    .join(" · ");
  const num = String(index + 1).padStart(2, "0");
  const musclesJoined = musclesToText(exercise.muscles);
  const supportJoined = linksToText(exercise.supportLinks);
  const [draft, setDraft] = useState<{
    id: string;
    muscles?: string;
    support?: string;
  } | null>(null);
  const musclesText =
    draft?.id === exercise.id && draft.muscles !== undefined
      ? draft.muscles
      : musclesJoined;
  const supportText =
    draft?.id === exercise.id && draft.support !== undefined
      ? draft.support
      : supportJoined;

  return (
    <article
      id={`ex-${exercise.id}`}
      className="panel exercise"
      data-exercise={exercise.id}
      data-pdf-exercise={num}
    >
      {editable && (
        <div className="ex-controls no-print">
          <button
            type="button"
            className="btn btn--soft"
            disabled={isFirst}
            aria-label={tx(locale, "up")}
            onClick={() => onReorder?.("up")}
          >
            {tx(locale, "up")}
          </button>
          <button
            type="button"
            className="btn btn--soft"
            disabled={isLast}
            aria-label={tx(locale, "down")}
            onClick={() => onReorder?.("down")}
          >
            {tx(locale, "down")}
          </button>
          <button
            type="button"
            className="btn btn--soft"
            disabled={busy?.text}
            aria-busy={busy?.text || undefined}
            onClick={onRegenerateText}
          >
            {busy?.text ? tx(locale, "regenTextBusy") : tx(locale, "regenText")}
          </button>
          <button
            type="button"
            className="btn btn--soft"
            disabled={busy?.image}
            aria-busy={busy?.image || undefined}
            onClick={onRegenerateImage}
          >
            {busy?.image ? tx(locale, "regenImageBusy") : tx(locale, "regenImage")}
          </button>
          <button type="button" className="btn btn--danger" onClick={onRemove}>
            {tx(locale, "remove")}
          </button>
        </div>
      )}

      <div className="exercise__head">
        <div>
          {editable ? (
          <input
              className="field-edit exercise__badge"
              value={exercise.badge}
              aria-label="Bloque o badge"
              onChange={(e) => onChange?.({ badge: e.target.value })}
            />
          ) : (
            <div className="exercise__badge">{exercise.badge}</div>
          )}

          {editable ? (
            <div className="mb-3 flex flex-col gap-2">
              <input
                className="field-edit exercise__title"
                value={exercise.name}
                onChange={(e) => onChange?.({ name: e.target.value })}
              />
              <input
                className="field-edit"
                style={{ color: "var(--primary)" }}
                value={exercise.nameEn ?? ""}
                placeholder="Nombre en inglés (opcional)"
                onChange={(e) =>
                  onChange?.({ nameEn: e.target.value || undefined })
                }
              />
            </div>
          ) : (
            <h2 className="exercise__title">
              {exercise.name}{" "}
              {exercise.nameEn ? <em>({exercise.nameEn})</em> : null}
            </h2>
          )}
        </div>

        <div className="dose">
          <span className="dose__label">{tx(locale, "doseLabel")}</span>
          {editable ? (
            <>
              <input
                className="field-edit dose__value"
                value={exercise.dose.setsReps}
                aria-label="Series y repeticiones"
                onChange={(e) =>
                  onChange?.({
                    dose: { ...exercise.dose, setsReps: e.target.value },
                  })
                }
              />
              <input
                className="field-edit dose__meta"
                value={exercise.dose.rpe ?? ""}
                placeholder="RPE (opcional)"
                aria-label="RPE"
                onChange={(e) =>
                  onChange?.({
                    dose: {
                      ...exercise.dose,
                      rpe: e.target.value || undefined,
                    },
                  })
                }
              />
              <input
                className="field-edit dose__meta"
                value={exercise.dose.rest ?? ""}
                placeholder="Descanso (opcional)"
                aria-label="Descanso"
                onChange={(e) =>
                  onChange?.({
                    dose: {
                      ...exercise.dose,
                      rest: e.target.value || undefined,
                    },
                  })
                }
              />
            </>
          ) : (
            <>
              <span className="dose__value">{exercise.dose.setsReps}</span>
              {doseMeta ? <span className="dose__meta">{doseMeta}</span> : null}
            </>
          )}
        </div>
      </div>

      {editable ? (
        <textarea
          className="field-edit exercise__intro"
          rows={3}
          value={exercise.intro}
          onChange={(e) => onChange?.({ intro: e.target.value })}
        />
      ) : (
        <p className="exercise__intro">{exercise.intro}</p>
      )}

      {editable || exercise.variation ? (
        <div className="ex-callout ex-callout--variation">
          <h3 className="ex-callout__title">{tx(locale, "variationLabel")}</h3>
          {editable ? (
            <textarea
              className="field-edit"
              rows={2}
              value={exercise.variation ?? ""}
              placeholder={tx(locale, "miniVariationPh")}
              onChange={(e) =>
                onChange?.({ variation: e.target.value || undefined })
              }
            />
          ) : (
            <p>{exercise.variation}</p>
          )}
        </div>
      ) : null}

      {editable || exercise.note ? (
        <div className="ex-callout ex-callout--note">
          <h3 className="ex-callout__title">{tx(locale, "noteLabel")}</h3>
          {editable ? (
            <textarea
              className="field-edit"
              rows={3}
              value={exercise.note ?? ""}
              placeholder={tx(locale, "miniNotePh")}
              onChange={(e) =>
                onChange?.({ note: e.target.value || undefined })
              }
            />
          ) : (
            <p>{exercise.note}</p>
          )}
        </div>
      ) : null}

      <figure className="sketch">
        {exercise.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.imageDataUrl}
            alt={`Boceto: ${exercise.name}`}
            width={1536}
            height={1024}
            decoding="async"
          />
        ) : (
          <div className="sketch__placeholder">
            <span>{busy?.image ? tx(locale, "sketchBusy") : tx(locale, "sketchPending")}</span>
            {onRegenerateImage ? (
              <button
                type="button"
                className="btn btn--soft mt-3 no-print"
                disabled={busy?.image}
                aria-busy={busy?.image || undefined}
                onClick={onRegenerateImage}
              >
                {busy?.image ? tx(locale, "regenImageBusy") : tx(locale, "sketchRetry")}
              </button>
            ) : null}
          </div>
        )}
        <figcaption className="sketch__caption">
          Boceto · {exercise.sketchCaption}
        </figcaption>
      </figure>

      {editable && (
        <input
          className="field-edit mb-4 no-print"
          value={exercise.sketchCaption}
          onChange={(e) => onChange?.({ sketchCaption: e.target.value })}
          placeholder="Caption del boceto"
        />
      )}

      <div className="grid-2">
        <div className="block">
          <h3 className="block__title">
            <span className="block__icon" aria-hidden />
            {tx(locale, "purpose")}
          </h3>
          {editable ? (
            <textarea
              className="field-edit"
              rows={5}
              value={exercise.purpose}
              onChange={(e) => onChange?.({ purpose: e.target.value })}
            />
          ) : (
            <p>{exercise.purpose}</p>
          )}
        </div>
        <div className="block">
          <h3 className="block__title">
            <span className="block__icon" aria-hidden />
            {tx(locale, "muscles")}
          </h3>
          {editable ? (
            <textarea
              className="field-edit"
              rows={4}
              value={musclesText}
              aria-label="Músculos, separados por coma"
              onChange={(e) =>
                setDraft({
                  id: exercise.id,
                  muscles: e.target.value,
                  support: draft?.id === exercise.id ? draft.support : undefined,
                })
              }
              onBlur={() => {
                onChange?.({ muscles: textToMuscles(musclesText) });
                setDraft((d) =>
                  d?.id === exercise.id ? { ...d, muscles: undefined } : d,
                );
              }}
            />
          ) : (
            <div className="tag-row">
              {exercise.muscles.map((m) => (
                <span key={m} className="tag">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="block" style={{ marginTop: 14 }}>
          <h3 className="block__title">
            <span className="block__icon" aria-hidden />
            {tx(locale, "howTo")}
          </h3>
        <div className="steps">
          {exercise.steps.map((step, stepIdx) => (
            <div className="step" key={`${exercise.id}-step-${stepIdx}`}>
              {editable ? (
                <>
                  <input
                    className="field-edit step__n"
                    value={step.title}
                    onChange={(e) => {
                      const steps = [...exercise.steps];
                      steps[stepIdx] = { ...step, title: e.target.value };
                      onChange?.({ steps });
                    }}
                  />
                  <textarea
                    className="field-edit"
                    rows={2}
                    value={step.body}
                    onChange={(e) => {
                      const steps = [...exercise.steps];
                      steps[stepIdx] = { ...step, body: e.target.value };
                      onChange?.({ steps });
                    }}
                  />
                </>
              ) : (
                <>
                  <span className="step__n">{step.title}</span>
                  <p>{step.body}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="split">
        <div className="warn">
          <h4>{tx(locale, "mistakes")}</h4>
          {editable ? (
            <ul className="edit-list">
              {(exercise.commonMistakes.length
                ? exercise.commonMistakes
                : [""]
              ).map((m, i) => (
                <li key={`${exercise.id}-err-${i}`} className="edit-list__row">
                  <textarea
                    className="field-edit edit-list__field"
                    rows={3}
                    value={m}
                    placeholder={`Error ${i + 1}`}
                    onChange={(e) => {
                      const source = exercise.commonMistakes.length
                        ? exercise.commonMistakes
                        : [""];
                      const next = [...source];
                      next[i] = e.target.value;
                      onChange?.({ commonMistakes: next });
                    }}
                  />
                  <button
                    type="button"
                    className="edit-list__remove"
                    aria-label="Quitar error"
                    onClick={() => {
                      const next = exercise.commonMistakes.filter(
                        (_, j) => j !== i,
                      );
                      onChange?.({
                        commonMistakes: next.length ? next : [""],
                      });
                    }}
                  >
                    {tx(locale, "removeMistake")}
                  </button>
                </li>
              ))}
              <li className="edit-list__add">
                <button
                  type="button"
                  className="btn btn--soft"
                  onClick={() => {
                    const current = exercise.commonMistakes.length
                      ? exercise.commonMistakes
                      : [""];
                    onChange?.({
                      commonMistakes: [...current, ""],
                    });
                  }}
                >
                  {tx(locale, "addMistake")}
                </button>
              </li>
            </ul>
          ) : (
            <ul>
              {exercise.commonMistakes.filter(Boolean).map((m, i) => (
                <li key={`${exercise.id}-m-${i}`}>{m}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="benefit">
          <h4>{tx(locale, "benefit")}</h4>
          {editable ? (
            <textarea
              className="field-edit"
              rows={4}
              value={exercise.benefit}
              onChange={(e) => onChange?.({ benefit: e.target.value })}
            />
          ) : (
            <p>{exercise.benefit}</p>
          )}
        </div>
      </div>

      <div className="support">
        <h4>{tx(locale, "support")}</h4>
        {editable ? (
          <textarea
            className="field-edit"
            rows={3}
            value={supportText}
            aria-label="Enlaces de apoyo"
            placeholder={
              "Una URL por línea. Opcional: Etiqueta | https://youtube.com/..."
            }
            onChange={(e) =>
              setDraft({
                id: exercise.id,
                support: e.target.value,
                muscles: draft?.id === exercise.id ? draft.muscles : undefined,
              })
            }
            onBlur={() => {
              onChange?.({ supportLinks: textToLinks(supportText) });
              setDraft((d) =>
                d?.id === exercise.id ? { ...d, support: undefined } : d,
              );
            }}
          />
        ) : (exercise.supportLinks ?? []).length > 0 ? (
          <ul className="support__list">
            {(exercise.supportLinks ?? []).map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support__link"
                >
                  {link.label || "Ver en YouTube"}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="support__empty">{tx(locale, "supportEmpty")}</p>
        )}
      </div>
    </article>
  );
}
