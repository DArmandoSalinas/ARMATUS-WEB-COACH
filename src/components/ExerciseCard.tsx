"use client";

import type { Exercise } from "@/lib/types";

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
  const doseMeta = [exercise.dose.rpe, exercise.dose.rest]
    .filter(Boolean)
    .join(" · ");
  const num = String(index + 1).padStart(2, "0");

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
            onClick={() => onReorder?.("up")}
          >
            Subir
          </button>
          <button
            type="button"
            className="btn btn--soft"
            disabled={isLast}
            onClick={() => onReorder?.("down")}
          >
            Bajar
          </button>
          <button
            type="button"
            className="btn btn--soft"
            disabled={busy?.text}
            onClick={onRegenerateText}
          >
            {busy?.text ? "Regenerando…" : "Regenerar texto"}
          </button>
          <button
            type="button"
            className="btn btn--soft"
            disabled={busy?.image}
            onClick={onRegenerateImage}
          >
            {busy?.image ? "Boceto…" : "Regenerar boceto"}
          </button>
          <button type="button" className="btn btn--danger" onClick={onRemove}>
            Eliminar
          </button>
        </div>
      )}

      <div className="exercise__head">
        <div>
          {editable ? (
            <input
              className="field-edit exercise__badge"
              value={exercise.badge}
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
        </div>

        <div className="dose">
          <span className="dose__label">Dosificación recomendada</span>
          {editable ? (
            <>
              <input
                className="field-edit dose__value"
                value={exercise.dose.setsReps}
                onChange={(e) =>
                  onChange?.({
                    dose: { ...exercise.dose, setsReps: e.target.value },
                  })
                }
              />
              <input
                className="field-edit dose__meta"
                value={doseMeta}
                onChange={(e) => {
                  const parts = e.target.value.split("·").map((s) => s.trim());
                  onChange?.({
                    dose: {
                      ...exercise.dose,
                      rpe: parts[0] || undefined,
                      rest: parts[1] || undefined,
                    },
                  });
                }}
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
          <div className="sketch__placeholder">Boceto pendiente</div>
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
            <span className="block__icon">⚡</span>
            Propósito y enfoque
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
            <span className="block__icon">◎</span>
            Enfoque muscular
          </h3>
          {editable ? (
            <textarea
              className="field-edit"
              rows={4}
              value={exercise.muscles.join(", ")}
              onChange={(e) =>
                onChange?.({
                  muscles: e.target.value
                    .split(",")
                    .map((m) => m.trim())
                    .filter(Boolean),
                })
              }
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
          <span className="block__icon">→</span>
          Cómo ejecutarlo
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
          <h4>Errores comunes</h4>
          {editable ? (
            <textarea
              className="field-edit"
              rows={4}
              value={exercise.commonMistakes.join("\n")}
              onChange={(e) =>
                onChange?.({
                  commonMistakes: e.target.value
                    .split("\n")
                    .map((m) => m.trim())
                    .filter(Boolean),
                })
              }
            />
          ) : (
            <ul>
              {exercise.commonMistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="benefit">
          <h4>Beneficio</h4>
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
        <h4>Apoyo adicional</h4>
        {editable ? (
          <textarea
            className="field-edit"
            rows={3}
            value={(exercise.supportLinks ?? [])
              .map((l) => (l.label ? `${l.label} | ${l.url}` : l.url))
              .join("\n")}
            placeholder={
              "Una URL por línea. Opcional: Etiqueta | https://youtube.com/..."
            }
            onChange={(e) => {
              const lines = e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean);
              const supportLinks = lines
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
              onChange?.({
                supportLinks: supportLinks.length ? supportLinks : undefined,
              });
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
          <p className="support__empty">Sin enlaces de apoyo.</p>
        )}
      </div>
    </article>
  );
}
