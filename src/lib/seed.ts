import type { Routine } from "./types";

/** Seeded legs example — offline demo with LegRoutine bocetos. */
export const SEED_ROUTINE_ID = "seed-ejemplo-piernas";

export const SEED_PROMPT = `Cliente: Atleta
Objetivo: fuerza de piernas para corredor de maratón / prevención de lesiones
Nivel: intermedio
Duración: ~45 min · 2× por semana
Ejercicios:
1. Sentadilla libre (Back Squat)
2. Single-Leg RDL
3. Sentadilla búlgara + Step-up con knee drive
4. Plancha Copenhagen
5. Complejo de tobillo (sóleo sentado + tibial anterior)
Notas: explicación biomecánica profesional, errores comunes y beneficio específico para running. Incluir bocetos técnicos.`;

export function createSeedRoutine(): Routine {
  const now = new Date().toISOString();
  return {
    id: SEED_ROUTINE_ID,
    createdAt: now,
    updatedAt: now,
    coachName: "Coach",
    clientName: "Atleta",
    objective:
      "Fuerza de piernas para corredor de maratón y prevención de lesiones",
    level: "intermedio",
    duration: "~45 min",
    frequency: "2× por semana",
    notes:
      "Protocolo biomecánico con explicación profesional, errores comunes y beneficio específico para running.",
    sourcePrompt: SEED_PROMPT,
    exercises: [
      {
        id: "ex-squat",
        order: 0,
        name: "Sentadilla libre",
        nameEn: "Back Squat",
        badge: "01 · Base de fuerza máxima",
        intro:
          "El estándar para reclutar unidades motoras, aumentar la rigidez tendinosa y mejorar la capacidad de absorber impacto en cada zancada. Aquí no buscamos volumen muscular: buscamos fuerza reactiva transferible a la carrera.",
        dose: {
          setsReps: "3–4 × 5–6",
          rpe: "RPE 7–8",
          rest: "Descanso 2–3 min",
        },
        purpose:
          "Desarrolla fuerza reactiva y potencia de extensión triple (cadera, rodilla y tobillo). Al elevar la tendon stiffness, el Aquiles y el cuádriceps almacenan y liberan energía elástica con más eficiencia en el contacto pie–suelo. Mejora el RFD, reduce el colapso de rodilla en la amortiguación y favorece la economía de carrera.",
        muscles: [
          "Cuádriceps",
          "Glúteo mayor",
          "Erectores espinales",
          "Isquiotibiales",
          "Sóleo",
        ],
        steps: [
          {
            title: "01 · Setup",
            body: "Barra sobre trapecios. Pies al ancho de hombros o ligeramente más abiertos, rotación externa 15–30°. Activa el trípode plantar (talón, base del 1er y 5º metatarsiano).",
          },
          {
            title: "02 · Brace",
            body: "Inhala 360° hacia el abdomen y estabiliza la columna con un brace firme antes de iniciar el descenso. El tronco debe sentirse “blindado”, no rígido como una tabla.",
          },
          {
            title: "03 · Excéntrica",
            body: "Flexiona cadera y rodilla a la vez. Desciende controlado hasta romper la paralela si tu movilidad de tobillo lo permite sin perder la lordosis lumbar.",
          },
          {
            title: "04 · Concéntrica",
            body: "Empuja el suelo con intención. Pecho alto, rodillas sobre la línea de los pies, exhala al completar la extensión. Piensa “acelerar el suelo hacia abajo”.",
          },
        ],
        commonMistakes: [
          "Valgo dinámico: la rodilla se hunde hacia dentro.",
          "Butt wink: la pelvis se mete en profundidad por falta de dorsiflexión o control de cadera.",
          "Talones que se levantan: acorta la base de apoyo y sobrecarga la rótula.",
        ],
        benefit:
          "Mejora la economía de carrera, retrasa la fatiga neuromuscular al final de distancias largas y ayuda a prevenir tendinopatía rotuliana y síndrome de dolor patelofemoral (runner’s knee).",
        sketchCaption: "Posición profunda",
        imageDataUrl: "/bocetos/squat.jpg",
      },
      {
        id: "ex-rdl",
        order: 1,
        name: "Single-Leg RDL",
        nameEn: "Peso muerto rumano unipodal",
        badge: "02 · Cadena posterior unipodal",
        intro:
          "Fortalece isquiotibiales y glúteos en un patrón de una sola pierna que replica la biomecánica del ciclo de zancada: bisagra de cadera + control anti-rotacional.",
        dose: {
          setsReps: "3 × 8–10 /pierna",
          rpe: "RPE 7",
          rest: "Descanso 90 s",
        },
        purpose:
          "Correr es una sucesión de apoyos unipodales. El Single-Leg RDL entrena la bisagra de cadera en una pierna mientras glúteo medio y tobillo evitan la rotación pélvica y el colapso del arco plantar.",
        muscles: [
          "Isquiotibiales",
          "Glúteo mayor",
          "Glúteo medio",
          "Tibial posterior",
          "Multífidos",
        ],
        steps: [
          {
            title: "01 · Posición",
            body: "Apóyate en una pierna con microflexión de rodilla (10–15°). La pierna libre queda larga detrás; el peso del cuerpo sobre el trípode del pie de apoyo.",
          },
          {
            title: "02 · Bisagra",
            body: "Empuja la cadera hacia atrás. Torso y pierna libre bajan como una palanca rígida en “T”. La espalda se mantiene neutra, no redondeada.",
          },
          {
            title: "03 · Pelvis nivelada",
            body: "Las crestas ilíacas miran al suelo. Evita que la cadera libre se “abra” hacia el techo — ese es el error más frecuente.",
          },
          {
            title: "04 · Extensión",
            body: "Empuja el talón de apoyo contra el suelo y cierra con el glúteo hasta la vertical. Intenta no apoyar el pie libre entre reps si el equilibrio lo permite.",
          },
        ],
        commonMistakes: [
          "Flexionar la columna en vez de bisagrar desde la cadera.",
          "Perder el trípode plantar o dejar caer el arco interno del pie.",
          "Rotar en exceso la cadera de la pierna elevada.",
        ],
        benefit:
          "Reduce el riesgo de distensiones de isquiotibiales en sprints y mejora la estabilidad pélvica, limitando el balanceo ineficiente tipo Trendelenburg.",
        sketchCaption: "Bisagra en T",
        imageDataUrl: "/bocetos/rdl.jpg",
      },
      {
        id: "ex-combo",
        order: 2,
        name: "Sentadilla búlgara + Step-up con knee drive",
        nameEn: "Bulgarian split squat + Step-up",
        badge: "03 · Dúo unipodal de potencia",
        intro:
          "Combo obligatorio: la búlgara construye fuerza de desaceleración en rango profundo; el step-up con ataque de rodilla transfiere esa fuerza a propulsión y cuestas.",
        dose: {
          setsReps: "3 × 8 + 8 /pierna",
          rest: "Biserie · Descanso 2 min",
        },
        purpose:
          "Combina fuerza excéntrica profunda (búlgara) con propulsión específica de zancada (step-up + knee drive). Ideal para corredores que enfrentan desniveles y necesitan estabilidad unipodal bajo fatiga.",
        muscles: [
          "Cuádriceps",
          "Glúteo mayor",
          "Glúteo medio",
          "Psoas",
          "Sóleo",
        ],
        steps: [
          {
            title: "01 · Búlgara — Setup",
            body: "Empeine trasero sobre un banco a altura de rodilla. Pie delantero a 60–80 cm del banco; torso erguido.",
          },
          {
            title: "02 · Búlgara — Ejecución",
            body: "Desciende en vertical hasta que la rodilla trasera casi toque el suelo. Rodilla delantera alineada con el 2º dedo; empuja el suelo sin rebotar.",
          },
          {
            title: "03 · Step-up — Impulso",
            body: "Pie completo sobre un cajón. Empuja solo con la pierna de arriba — sin impulsarte de puntillas desde el suelo.",
          },
          {
            title: "04 · Step-up — Knee drive",
            body: "Arriba: triple extensión + rodilla libre hacia el pecho a 90°. Baja en 3 segundos con control excéntrico estricto.",
          },
        ],
        commonMistakes: [
          "Búlgara: inclinarte en exceso o levantar el talón delantero.",
          "Step-up: impulsarte con el pie inferior; la carga debe vivir en la pierna de arriba.",
        ],
        benefit:
          "Ayuda a prevenir el síndrome de la cintilla iliotibial (ITBS) y la condromalacia rotuliana, y aporta potencia específica para desniveles y tramos de montaña.",
        sketchCaption: "Pie trasero elevado / Knee drive",
        imageDataUrl: "/bocetos/bulgarian.jpg",
      },
      {
        id: "ex-copenhagen",
        order: 3,
        name: "Plancha Copenhagen",
        nameEn: "Adductor plank",
        badge: "04 · Estabilidad aductora",
        intro:
          "El estándar para salud de aductores, estabilidad pélvica lateral y transferencia de fuerza en el plano frontal — donde muchos corredores están desprotegidos.",
        dose: {
          setsReps: "3 × 20–30 s /lado",
          rest: "Isométrico · Descanso 60 s",
        },
        purpose:
          "El aductor mayor actúa como extensor y estabilizador pélvico en el apoyo. La Copenhagen genera una co-contracción potente entre ingle y core lateral, reforzando el anillo pélvico frente a impactos repetitivos.",
        muscles: [
          "Aductor mayor",
          "Aductor largo",
          "Oblicuos",
          "Cuadrado lumbar",
          "Glúteo medio",
        ],
        steps: [
          {
            title: "01 · Lateral",
            body: "Acuéstate de lado con el antebrazo a 90° respecto al hombro. Cuerpo alineado de cabeza a pies.",
          },
          {
            title: "02 · Apoyo",
            body: "Apoya la cara interna de la rodilla (principiante) o del tobillo (avanzado) de la pierna superior sobre un banco.",
          },
          {
            title: "03 · Elevación",
            body: "Sube la cadera hasta formar una línea recta. No dejes que la pelvis caiga ni que el pecho rote hacia el suelo.",
          },
          {
            title: "04 · Aducción",
            body: "Mantén la pierna inferior elevada bajo el banco sin tocar el piso. Respira de forma fluida; no aguantes la respiración.",
          },
        ],
        commonMistakes: [
          "Dejar caer la cadera por fatiga del oblicuo o aductor.",
          "Rotar el pecho hacia el suelo y perder la alineación lateral.",
          "Pasar a palanca de tobillo antes de dominar la versión de rodilla.",
        ],
        benefit:
          "Reduce la incidencia de pubalgia y sobrecargas de ingle, y mantiene la cadera estable en terrenos irregulares o cambios de dirección.",
        sketchCaption: "Plancha lateral aductora",
        imageDataUrl: "/bocetos/copenhagen.jpg",
      },
      {
        id: "ex-ankle",
        order: 4,
        name: "Complejo de tobillo",
        nameEn: "Sóleo sentado + tibial anterior",
        badge: "05 · Complejo antero-posterior de tobillo",
        intro:
          "Trabajo focal del sóleo (fuerza profunda de propulsión) y del tibial anterior (freno del pie en el heel strike) para tolerar impacto de forma inteligente.",
        dose: {
          setsReps: "3–4 × 12–15",
          rest: "Excéntrica 3 s · Descanso 60 s",
        },
        purpose:
          "El sóleo puede soportar 6–8× el peso corporal al correr. Con la rodilla a 90°, asume casi toda la carga de plantarflexión. El tibial anterior frena la caída del pie en el contacto inicial y modula pronación/supinación.",
        muscles: ["Sóleo", "Gastrocnemio", "Tibial anterior"],
        steps: [
          {
            title: "01 · Sóleo — Setup",
            body: "Siéntate con rodillas a 90° y metatarsos sobre un bloque elevado. Carga sobre los muslos, cerca de las rodillas.",
          },
          {
            title: "02 · Sóleo — Ejecución",
            body: "Baja el talón al máximo con estiramiento controlado (3 s). Empuja por el metatarso hasta el tope y pausa 1 s arriba.",
          },
          {
            title: "03 · Tibial — Setup",
            body: "Siéntate en un banco alto con las piernas colgando. Engancha una pesa rusa ligera (4–8 kg) o banda en el empeine.",
          },
          {
            title: "04 · Tibial — Ejecución",
            body: "Dorsiflexiona llevando la punta hacia la espinilla. Pausa arriba y baja en 3 s con control estricto.",
          },
        ],
        commonMistakes: [
          "Rebotar abajo en el sóleo y perder tensión muscular útil.",
          "Rotar el tobillo en vez de moverlo en el plano sagital puro.",
        ],
        benefit:
          "Prevención específica de periostitis tibial (MTSS), tendinopatía de Aquiles, fascitis plantar y fracturas por estrés.",
        sketchCaption: "Sóleo sentado",
        imageDataUrl: "/bocetos/soleus.jpg",
      },
    ],
  };
}
