# Informe NotebookLM — Nexus-Educación

> Generado 2026-10-11 desde el cuaderno [Nexus-Educación](https://notebook.google.com/notebook/d3b34e36-c736-483b-89e4-0e57eb06e7dc) (52 fuentes). Respuesta grounded; no reescrita.

### Informe Completo del Cuaderno Nexus-Educación

---

### 1. Qué es el producto Nexus-Edu
**Nexus-Edu** es un sistema de soporte a decisiones (DSS) en formato de aplicación de escritorio, concebido para el seguimiento, gestión y evaluación cualitativa de alumnos en instituciones educativas (focalizado en el grupo escolar de 1°C) [1-4].

* **Objetivo y Usuarios:** Su usuario principal es el docente o equipo pedagógico [2, 4, 5]. Busca simplificar el registro de evaluaciones periódicas, la visualización de métricas del curso y el seguimiento de casos especiales sin depender de servicios en la nube de terceros [2, 4, 5].
* **Dominio Pedagógico y Escala de Calificación:**
  * La evaluación se organiza cualitativamente por **áreas pedagógicas canónicas** (Quehaceres, Convivencia, Lengua, Matemática, etc.) y **bimestres** [4, 6].
  * **Escala oficial de valoración** (ordenada de mayor a menor jerarquía):
    1. **D** — *Destacado* (Rango 1, desempeño superior) [2, 4, 7].
    2. **AV** — *Avanzado* (Rango 2) [4, 7].
    3. **AL** — *Alcanzado* (Rango 3) [4, 7].
    4. **EP** — *En Proceso* (Rango 4) [4, 7].
    5. **NO** — *No alcanzó los objetivos* (Rango 5) [4, 7].
* **Flag PPI (Proyecto Pedagógico Individual):** Campo booleano obligatorio (`ppi`, con valor por defecto `false` / No) para identificar a los estudiantes que cuentan con adaptaciones curriculares específicas derivadas del Certificado Único de Discapacidad (CUD) [4, 7, 8].

---

### 2. Stack Técnico y Arquitectura
La arquitectura técnica del proyecto combina un entorno naitvo de escritorio con tecnologías web modernas y almacenamiento local estricto [3, 4, 9]:

* **Entorno de Escritorio:** **Electron.js** gestionado mediante **`electron-vite`** [3, 4].
* **Frontend y UI:** **React 19** y **TypeScript 5**, estilizado con **Tailwind CSS 4** utilizando la paleta temática **Tierra** (tokens `--tierra-*` y badges semánticos para notas: D musgo, AV ocre, AL arcilla suave, EP arcilla, NO terracota) [3, 4, 10-12]. La interfaz incorpora componentes de **shadcn/ui** y **Lucide Icons** [3].
* **Formularios y Validación:** **React Hook Form** integrado con validación de esquemas estricta mediante **Zod 4** [3, 4, 13].
* **Persistencia de Datos:** Base de datos embebida **SQLite** (`better-sqlite3`), ubicada en la carpeta `userData` del sistema operativo [3-5, 9]. Se inicializa mediante una siembra (seed) automática extraída de una planilla Excel (`resources/planilla_base__datos_alumnos.xlsx`) con datos del curso [3-5, 9].
* **Seguridad en Electron:** Aplica aislamiento de contexto (`contextIsolation: true`), deshabilitación de Node en el renderizador (`nodeIntegration: false`), `sandbox: true`, CSP estricto y exposición segura de APIs mediante `contextBridge` en `preload.ts` [9, 14].
* **Testing:** Pruebas unitarias de parsers y modelos con **Vitest**, y pruebas end-to-end (E2E) con **Playwright** [3, 4, 15, 16].
* **Empaquetado y Distribución:** Configuración de **`electron-builder`** (declarado en `devDependencies`) para generar ejecutables e instaladores (por ejemplo, paquetes `AppImage` o `.deb` para Linux) [3, 4, 9, 17].

---

### 3. Estado Avanzado del Proyecto según los Docs del Repo
El proyecto cuenta con una integración avanzada de herramientas de automatización, trazabilidad e inteligencia artificial [1, 18-20]:

* **Jira EDU & Board:** Vinculado al proyecto **EDU** en Atlassian (`[suspicious link removed]`, cloudId `c51efaad-12f4-4cac-88b4-4abfa3cabd81`) [1, 18, 21].
* **Workflow AGNT:**
  * **Estados configurados en el tablero:** *Por hacer* (10000), *Lista AGNT* (10002, disparador para que el agente Cursor tome el ticket), *En curso* (10001), *RESPUESTA AGNT* (10004, post Resultado AGNT) y *Finalizada* (10003) [1, 18, 22].
  * **Estructura `## AGNT`:** Cada ticket incluye un bloque estandarizado en la descripción (`schema: agnt-v1`) con las claves `OBJ`, `CTX`, `EVOL`, `ACT`, `DEPS`, `NEXT`, `SIG` y `PUERTA` para mantener el contexto denso del agente [23-25].
* **Backlog de Historias de Usuario:**
  * `EDU-SETUP` / `EDU-4`: Alineación del workflow AGNT [1, 26].
  * `H1` / `EDU-5`: Dashboard de métricas de evaluación [2, 26].
  * `H2` / `EDU-6`: CRUD de alumnos y seed desde Excel [5, 26].
  * `H3` / `EDU-7`: Registro de evaluación cualitativa por área/bimestre [6, 26].
  * `H4` / `EDU-8`: Implementación del flag PPI [8, 26].
  * `H5` / `EDU-9`: Build instalable en Linux [17, 26].
  * `H6` / `EDU-10`: Suite de tests Vitest + Playwright [16, 26].
  * `H7` / `EDU-11` & `H8` / `EDU-12`: Exportación de boletines y backup/restore de SQLite (historias para backlog futuro) [26-28].
* **Integración MCP Atlassian & NotebookLM:**
  * Conexión remota MCP mediante servidor dedicado `atlassian-nexus-edu` [19, 29].
  * Servidor MCP `notebooklm-nexus-edu` vinculado directamente con el cuaderno "Nexus-Educación" (ID `d3b34e36-c736-483b-89e4-0e57eb06e7dc`), permitiendo consultas grounded y sincronización de documentación sin salir del editor [19, 20, 30].

---

### 4. Skills y Rules del Agente
El agente de desarrollo opera mediante un conjunto estandarizado de reglas pasivas (*Rules*) y capacidades activas por demanda (*Skills*) [3, 31-33]:

* **Rules del Agente (`.cursor/rules/`):**
  * `[suspicious link removed]`: Carga siempre el contexto global del stack, tablero Jira EDU, reglas de dominio y herramientas [19, 33].
  * `[suspicious link removed]`: Exige que los mensajes de commit y PRs se redacten en español citando la clave Jira (`EDU-NN`), activando un guardado de memoria Engram tras cada commit [34].
* **Skills del Agente (`.cursor/skills/`):**
  * `nexus-edu`: Guía del dominio, paleta Tierra, comandos (`pnpm dev`, `pnpm dist`) y modelo de evaluación [3].
  * `electron`, `react-19`, `typescript`, `tailwind-4`, `zod-4`, `playwright`: Conjunto de skills (algunas provistas por la comunidad *Gentleman-Skills*) adaptadas al alcance del proyecto para garantizar código limpio y patrones seguros [10-13, 15, 35].
  * `jira-agnt-ticket-unico`, `jira-agnt-bloque-descripcion`, `jira-ticket-intake`: Automatizan la lectura de tickets en Jira, la edición del bloque `## AGNT`, el análisis de requerimientos y la publicación de comentarios estructurados (*Resultado AGNT* / *Puerta de código*) [24, 36, 37].
  * `notebooklm-nexus-edu` y `nlm-skill`: Permiten consultar la documentación grounded e interactuar con la CLI/MCP de NotebookLM [30, 38].

---

### 5. Clasificación de las Fuentes del Cuaderno
Las 52 fuentes presentes en el cuaderno se agrupan en dos categorías principales:

#### (a) Documentación propia del repositorio y del proyecto
* **Especificaciones y reglas de dominio:** `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]` (múltiples instancias por skill), `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `[suspicious link removed]` [3, 4, 33, 34].
* **Gestión Jira y Workflows:** `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `[suspicious link removed]`, `[suspicious link removed]`, `[suspicious link removed]` [1, 18, 29, 39].
* **Integración NotebookLM y Tooling:** `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `nexus-edu:[suspicious link removed]`, `[suspicious link removed]` [20, 40-44].

#### (b) Referencias externas e investigación técnica
* **Arquitectura de Dashboards y UI/UX:**
  * *Design Patterns to Support the Usability and User Experience Evaluation of Dashboards for Decision Support Systems* (Estudio académico sobre patrones DP-DASHBOARD para DSS) [45, 46].
  * *Advanced Student Management — React Dashboard - The Project Stack* y *Electro-Dash* (Plantillas y patrones de dashboards educativos) [47-50].
* **Desarrollo Electron, React y Seguridad:**
  * *Seguridad | Electron* (Guía oficial de seguridad Electron) [51, 52].
  * *Deployment, Packaging y Distributing de una aplicación en Electron.js a producción* (Guía de packaging) [53, 54].
  * *daltonmenezes/electron-app* (Boilerplate Electron Vite + React 19) [55, 56].
  * *Primera app con Electron.js: Comunicar proceso principal con proceso de renderizado* (Video de Andrés Cruz) [57, 58].
  * *Validación de formularios en React - Luis Llamas* y *React la guía máxima de buenas prácticas* [59-61].
* **Ecosistema de Agentes, Cursor, Skills y MCP:**
  * *Agyn: A Multi-Agent System for Team-Based Autonomous Software Engineering* (Paper sobre agentes de desarrollo) [62, 63].
  * *GitHub - Gentleman-Programming/Gentleman-Skills* (Repositorio de skills curadas) [64, 65].
  * *Construye una App Completa Solo con Cursor + Skills + CLIs* (Video de Fazt Code) [66, 67].
  * *Cursor Rules, Skills, and Commands* e *Integración de Jira en Cursor Docs / Composio / excentia* [31, 68-70].
  * *Mejores prácticas para programar con agentes - Cursor* y *practical ai workflow in cursor* [71, 72].

---

### 6. Decisiones y Convenciones Importantes
* **Commits y Pull Requests:** Obligatoriedad de escribir mensajes de commit y títulos/descripciones de PR en **español**, incluyendo la clave de ticket Jira (`EDU-NN`) [34]. Cada commit dispara un guardado de contexto en Engram (`topic_key: nexus-edu/commits/...`) [34].
* **Cuenta Google e Identidad:** Toda la infraestructura remota y de IA (Jira MCP, NotebookLM, proyectos Atlassian) está centralizada bajo la cuenta personal/técnica `gonzalomlopolito@gmail.com` [18-20, 29].
* **Aislamiento por Proyecto:**
  * El servidor MCP Atlassian se configura de forma aislada (`atlassian-nexus-edu`) en `.cursor/mcp.json`, guardando tokens en `.cursor/atlassian-mcp-auth/` para evitar colisiones con otros sitios Atlassian (como *feelibizaproperties*) [19, 29].
  * El cuaderno "Nexus-Educación" de NotebookLM tiene su propio perfil aislado (`nexus-edu`) en `.cursor/notebooklm-mcp-auth/` [20, 73].
* **Protección de Datos Personales (PII):** Prohibición estricta de subir nombres reales, DNI, domicilios o teléfonos de alumnos a tickets de Jira, cuadernos públicos de NotebookLM o archivos versionados [5, 21, 74, 75].
* **Puerta de Código (Aprobación de Cambios):** Ante cualquier ticket de Jira que exija modificar archivos del repositorio, el agente no debe aplicar los cambios de inmediato; debe publicar primero la plantilla *Puerta de código* y solicitar la aprobación explícita de `@Gonzalo Lopolito` [22, 76].

---

### 7. Huecos o Próximos Pasos Evidentes
1. **Estado `RESPUESTA AGNT` (id 10004):** creado en UI 2026-10-11 (MCP no puede crear estados en team-managed). Ciclo operativo: Lista AGNT → Resultado AGNT → RESPUESTA AGNT → Finalizada [22, 23, 77].
2. **Exportación de Boletines y Reportes (H7 / EDU-11):** Es una funcionalidad pendiente en el backlog futuro. Falta definir con los docentes el formato de salida (PDF o Excel) y la maquetación del boletín [27, 78].
3. **Backup y Restauración de SQLite (H8 / EDU-12):** Pendiente implementar un mecanismo visual para importar/exportar la base de datos física almacenada en `userData` [28, 79].
4. **Validación del Pipeline de Empaquetado Linux (H5 / EDU-9):** Probar el comando `pnpm dist` en un entorno CI/CD local para verificar la generación correcta de ejecutables AppImage/deb [17, 80].
5. **Ampliación de Cobertura E2E (H6 / EDU-10):** Expandir la suite de pruebas de Playwright para cubrir los flujos completos de carga de notas por área y edición de perfiles con flag PPI [16, 81].
