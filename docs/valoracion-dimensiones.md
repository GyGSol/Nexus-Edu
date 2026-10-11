# Valoración por dimensiones

La ficha de Alumno carga pautas **por dimensión** (no solo una nota por área), alineado al sistema origen y a la planilla Excel de 1°C.

## Quick path

1. `pnpm dev` → Alumnos → editar alumno → **Valoración por dimensiones**.
2. Si las pautas aparecen en `—`: sidebar → **Reimportar Excel** (o reiniciar: el seed auto-rellena si no hay `dimension_key`).
3. Verificar 1° bimestre: Quehaceres/Convivencia/Lengua con AV/AL; Matemática dims 4–5 = *No corresponde…* (`NC`); Conoc. del Mundo dim 5 = `NC`.

## Selector de pautas

| Código | Etiqueta UI | Uso |
|--------|-------------|-----|
| D | Destacado | Escala cualitativa |
| AV | Avanzado | Escala cualitativa |
| AL | Alcanzado | Escala cualitativa |
| EP | En Proceso | Escala cualitativa |
| NO | No alcanzó los objetivos | Escala; disponible en UI ahora y a futuro |
| NC | No corresponde a la clasificación del bimestre | Dimensión fuera de la planificación del bimestre |
| PPI_NO | PPI - NO | Fila PPI por materia |
| PPI_SI | PPI - SI | Fila PPI por materia |

Códigos en [`src/shared/types.ts`](../src/shared/types.ts) (`ASSESSMENT_MARKS` / `ASSESSMENT_MARK_LABELS`).

La escala agregada del dashboard (`GRADES` D→NO) **no** incluye `NC` ni PPI en la distribución de riesgo.

## Conceptos y dimensiones

Catálogo canónico: [`src/shared/dimensiones.ts`](../src/shared/dimensiones.ts) (30 slots).

| Concepto (`area`) | Título UI | Dimensiones |
|-------------------|-----------|-------------|
| Quehaceres | Trabajo en el aula / Quehaceres… | q1…q5 |
| Convivencia | Convivencia / Convivencia | c1…c5 |
| Lengua | Lengua / Lengua | ppi + l1…l5 |
| Matemática | Matemática / Matemática | ppi + m1…m5 |
| Conoc. del Mundo | Conocimiento del Mundo / … | ppi + cm1…cm5 |
| Extraprogramáticas | ÁREAS EXTRAPROGRAMÁTICAS / Tutorías | tutoria, taller |

## Import Excel

Fuente: `resources/planilla_base__datos_alumnos.xlsx` (hojas de bimestre).

| Columna planilla | Destino |
|------------------|---------|
| Cadena `AV - AL - …` (detalle) | Una fila `assessments` por dimensión evaluable |
| Token `NO` **en esa cadena** | **`NC`** (no corresponde), **no** “No alcanzó” |
| Token futuro `NAO` / `NO_OBJ` | `NO` (No alcanzó los objetivos) |
| `NOTA …` (agregada) | Fila legacy `dimension_key = ''` (no cuenta para cierre) |
| NOTA TUTORÍA / T. LITERARIO | Extraprogramáticas `tutoria` / `taller` |
| PPI en cadena | No viene; al importar materias con PPI → default `PPI_NO` |

Parser: [`src/main/db/excel-parser.ts`](../src/main/db/excel-parser.ts) (`parseDimensionDetailChain`, `pushDimensionAssessments`, `findStudent`).

**Match de nombres:** la hoja de bimestre a veces omite un nombre de pila (p. ej. personales `Jorge Ignacio` + `Espinoza Marañon` vs etiqueta `Espinoza Marañon Ignacio`). El parser hace match exacto / substring y, si falla, por **subconjunto de tokens**.

### Seed / reimport

- Primera vez o DB vacía: `ensureSeeded` → `importFromExcel('replace')`.
- DB con alumnos pero **sin** filas `dimension_key`, o con algún alumno **sin assessments** mientras otros sí: `ensureSeeded` hace `importFromExcel('merge')`.
- Flags **PPI de alumno** se conservan en `replace` y `merge` (no vienen del Excel).
- Botón UI **Reimportar Excel**: `replace` completo (también conserva PPI).

SQLite: `~/.config/nexus-edu/data/nexus-edu.sqlite` · unique `(student_id, bimester, area, dimension_key)`.

## Nota agregada por área (EDU-17)

La nota por área es **juicio docente** (NotebookLM / REDE Art. 14): no hay promedio aritmético obligatorio.

| Pieza | Comportamiento |
|-------|----------------|
| Sugerencia | Moda de pautas D/AV/AL/EP/NO de dimensiones evaluables del área (excl. PPI, `NC`, fila legacy). Empate → más baja. No vinculante. |
| Selector | Editable D/AV/AL/EP/NO; persiste `dimension_key = ''` |
| Seed Excel | Conserva columna `NOTA …`; editar dimensiones **no** pisa la nota salvo **Aplicar sugerencia** |
| Cierre | Sigue siendo 30 dims + frase ([`valoracion-final.ts`](../src/shared/valoracion-final.ts)); la nota agregada no reemplaza el cierre |

Helpers: [`src/shared/phrase-grade.ts`](../src/shared/phrase-grade.ts) (`suggestedAreaGrade`, `aggregatedAreaGrade`).  
UI: ficha Alumno → Valoración por dimensiones → nota agregada / sugerencia / Aplicar sugerencia.

**Estado (2026-10-11):** implementado y validado en app (`pnpm dev`) por el usuario.

## Cierre valoración final

Completa = las **30** dimensiones del catálogo con pauta + frase final resuelta en catálogo.  
Lógica: [`src/shared/valoracion-final.ts`](../src/shared/valoracion-final.ts).

## Checklist

- [ ] Selector muestra D/AV/AL/EP/NO/NC/PPI_NO/PPI_SI
- [ ] Excel `NO` en cadena → UI muestra *No corresponde a la clasificación del bimestre*
- [ ] Matemática m4/m5 y Conoc. del Mundo cm5 = `NC` tras import 1° bimestre
- [x] Nota agregada editable + sugerencia moda + Aplicar sugerencia (EDU-17) — validado en app 2026-10-11
- [x] `pnpm test:unit` verde (incl. `phrase-grade` sugerencia/agregada)

## Historias / backlog

- **H13** — UI + modelo dimensiones ([jira-stories-backlog.md](jira-stories-backlog.md)) — implementado en repo.
- **H14** — Import Excel NO→NC — implementado en repo.
- **H15 / [EDU-17](https://nexus-educacion.atlassian.net/browse/EDU-17)** — Nota agregada desde dimensiones — **Finalizada** (validado en app).
