/** Catálogo de conceptos/materias y dimensiones de valoración (captura sistema origen). */

export interface DimensionDef {
  key: string
  label: string
  /** Fila PPI por materia (Lengua, Matemática, Conoc. del Mundo). */
  kind: 'ppi' | 'dimension'
}

export interface ConceptoMateria {
  key: string
  /** Título de bloque: "Concepto / materia" */
  title: string
  dimensions: DimensionDef[]
}

export const CONCEPTOS_MATERIA: ConceptoMateria[] = [
  {
    key: 'Quehaceres',
    title: 'Trabajo en el aula / Quehaceres del/a estudiante',
    dimensions: [
      {
        key: 'q1',
        kind: 'dimension',
        label:
          'Se organiza para realizar sus tareas ajustándose a las pautas de trabajo y demuestra una autonomía creciente.'
      },
      {
        key: 'q2',
        kind: 'dimension',
        label: 'Expresa sus ideas de manera clara y participa activamente en clase.'
      },
      {
        key: 'q3',
        kind: 'dimension',
        label:
          'Asume de manera colaborativa las tareas dentro de un grupo y contribuye al logro de los objetivos comunes.'
      },
      {
        key: 'q4',
        kind: 'dimension',
        label: 'Manifiesta interés por aprender y pregunta cuando no comprende.'
      },
      {
        key: 'q5',
        kind: 'dimension',
        label:
          'Reconoce sus logros e identifica sus dificultades como parte de su proceso de aprendizaje.'
      }
    ]
  },
  {
    key: 'Convivencia',
    title: 'Convivencia / Convivencia',
    dimensions: [
      {
        key: 'c1',
        kind: 'dimension',
        label:
          'Participa en la construcción de acuerdos escolares de convivencia y respeta las normas institucionales.'
      },
      {
        key: 'c2',
        kind: 'dimension',
        label:
          'Utiliza estrategias comunicacionales asertivas para expresar sus emociones, experiencias y opiniones.'
      },
      {
        key: 'c3',
        kind: 'dimension',
        label:
          'Resuelve conflictos a través de la escucha activa y el diálogo constructivo, apelando a la reflexión y a instancias de reparación.'
      },
      {
        key: 'c4',
        kind: 'dimension',
        label:
          'Colabora en tareas grupales y juegos de manera colaborativa, cooperativa e inclusiva.'
      },
      {
        key: 'c5',
        kind: 'dimension',
        label:
          'Contribuye a la construcción de un clima escolar de bienestar social, estableciendo vínculos con pares y adultos de la escuela, promoviendo el cuidado de sí y de los otros, el respeto y la inclusión de la diversidad.'
      }
    ]
  },
  {
    key: 'Lengua',
    title: 'Lengua / Lengua',
    dimensions: [
      { key: 'ppi', kind: 'ppi', label: 'PPI' },
      {
        key: 'l1',
        kind: 'dimension',
        label: 'Conoce la escritura y relaciona sonidos y letras.'
      },
      {
        key: 'l2',
        kind: 'dimension',
        label: 'Lee y escribe palabras con autonomía.'
      },
      {
        key: 'l3',
        kind: 'dimension',
        label: 'Participa de manera activa durante la lectura de textos que hace el docente.'
      },
      {
        key: 'l4',
        kind: 'dimension',
        label: 'Escribe textos breves en colaboración con el docente y sus compañeros.'
      },
      {
        key: 'l5',
        kind: 'dimension',
        label: 'Comunica sus ideas en las conversaciones grupales.'
      }
    ]
  },
  {
    key: 'Matemática',
    title: 'Matemática / Matemática',
    dimensions: [
      { key: 'ppi', kind: 'ppi', label: 'PPI' },
      {
        key: 'm1',
        kind: 'dimension',
        label:
          'Usa y comprende números de una y dos cifras, reconoce cómo se escriben, se dicen y se representan de distintas maneras, y observa algunas regularidades en la secuencia de números.'
      },
      {
        key: 'm2',
        kind: 'dimension',
        label:
          'Cuenta, organiza y compara cantidades; utiliza diferentes formas de contar y distintos materiales para resolver situaciones sencillas.'
      },
      {
        key: 'm3',
        kind: 'dimension',
        label:
          'Resuelve problemas y realiza cálculos de suma y resta; utiliza distintas formas de pensar y calcular según cada situación.'
      },
      {
        key: 'm4',
        kind: 'dimension',
        label:
          'Comprende y comunica relaciones espaciales y geométricas, ubica objetos, describe recorridos, y reconoce figuras y cuerpos geométricos del entorno.'
      },
      {
        key: 'm5',
        kind: 'dimension',
        label:
          'Compara y mide longitudes y comprende situaciones relacionadas con el tiempo, como la duración de actividades y el orden de los acontecimientos.'
      }
    ]
  },
  {
    key: 'Conoc. del Mundo',
    title: 'Conocimiento del Mundo / Conocimiento del mundo',
    dimensions: [
      { key: 'ppi', kind: 'ppi', label: 'PPI' },
      {
        key: 'cm1',
        kind: 'dimension',
        label:
          'Observa,describe y compara objetos, fenómenos y procesos en distintos tiempos y espacios.'
      },
      {
        key: 'cm2',
        kind: 'dimension',
        label:
          'Identifica diferentes modos en que las personas organizan y transforman los espacios.'
      },
      {
        key: 'cm3',
        kind: 'dimension',
        label:
          'Reconoce aspectos de la vida cotidiana familiar y social del presente y del pasado.'
      },
      {
        key: 'cm4',
        kind: 'dimension',
        label:
          'Reconoce la importancia del cuidado integral a través del conocimiento del cuerpo, prácticas saludables, instituciones y derechos.'
      },
      {
        key: 'cm5',
        kind: 'dimension',
        label:
          'Reconoce, describe y compara las características observables de plantas, animales y materiales.'
      }
    ]
  },
  {
    key: 'Extraprogramáticas',
    title: 'ÁREAS EXTRAPROGRAMÁTICAS / Tutorías',
    dimensions: [
      { key: 'tutoria', kind: 'dimension', label: 'Tutoría' },
      {
        key: 'taller',
        kind: 'dimension',
        label: 'Taller Literario y Dramatización.'
      }
    ]
  }
]

export type ConceptoKey = (typeof CONCEPTOS_MATERIA)[number]['key']

/** Claves de concepto para filtros / listados. */
export const CONCEPT_KEYS = CONCEPTOS_MATERIA.map((c) => c.key)

export function allDimensionSlots(): Array<{ area: string; dimensionKey: string }> {
  return CONCEPTOS_MATERIA.flatMap((concepto) =>
    concepto.dimensions.map((d) => ({ area: concepto.key, dimensionKey: d.key }))
  )
}

/** Dimensiones evaluables (sin fila PPI) en orden del catálogo / Excel. */
export function evaluableDimensionKeys(area: string): string[] {
  const concepto = CONCEPTOS_MATERIA.find((c) => c.key === area)
  if (!concepto) return []
  return concepto.dimensions.filter((d) => d.kind === 'dimension').map((d) => d.key)
}

export function ppiDimensionKey(area: string): string | null {
  const concepto = CONCEPTOS_MATERIA.find((c) => c.key === area)
  const ppi = concepto?.dimensions.find((d) => d.kind === 'ppi')
  return ppi?.key ?? null
}
