# MCP Jira — Nexus-Edu (sitio aislado)

## Objetivo

Autenticar **solo este proyecto** contra [nexus-educacion / EDU](https://nexus-educacion.atlassian.net/jira/software/projects/EDU/boards/1) con `gonzalomlopolito@gmail.com`, sin reutilizar el OAuth de Feel Ibiza (`feelibizaproperties`).

## Configuración en el repo

[`.cursor/mcp.json`](../.cursor/mcp.json) define el servidor **`atlassian-nexus-edu`**:

- Tipo: HTTP nativo Cursor (`type: http`)
- URL: `https://mcp.atlassian.com/v2/mcp`
- OAuth: gestionado por Cursor al conectar este servidor (independiente del plugin Feel Ibiza)
- Copia de respaldo (legado mcp-remote): `.cursor/atlassian-mcp-auth/` (gitignore)

También está en `~/.cursor/mcp.json` (workaround si el MCP de proyecto queda `disconnected`).

cloudId del sitio: `c51efaad-12f4-4cac-88b4-4abfa3cabd81`

## Estado (2026-10-11)

| | |
|--|--|
| Sitio canónico | `https://nexus-educacion.atlassian.net` |
| cloudId | `c51efaad-12f4-4cac-88b4-4abfa3cabd81` |
| Transporte | HTTP MCP (no `mcp-remote`; ese proxy cerraba la conexión en Cursor) |

En Cursor: **Settings → Tools & MCP** → habilitar **`atlassian-nexus-edu`** → Connect / Authenticate → elegir **`nexus-educacion.atlassian.net`** (no Feel Ibiza) → recargar ventana.

## Re-autenticar (si hace falta)

1. En Cursor: **Settings → MCP** y asegurate de que **`atlassian-nexus-edu`** esté habilitado.
2. Cuando pida login, abrí el OAuth en el navegador.
3. Entrá con **`gonzalomlopolito@gmail.com`**.
4. En la pantalla de sitios Atlassian, seleccioná **`nexus-educacion.atlassian.net`** (no feelibizaproperties).
5. Volvé al chat y pedí: *verificar Jira EDU*.

### Si el grant queda en el sitio equivocado

1. Settings → Tools & MCP → **atlassian-nexus-edu** → Disconnect / Sign out.
2. Command Palette: **Authentication: Remove Dynamic Authentication Providers** (solo si hace falta; también afecta el plugin Feel Ibiza).
3. Volvé a Connect en **atlassian-nexus-edu** y elegí **solo** `nexus-educacion.atlassian.net`.

Legado (si aún usás tokens mcp-remote):

```bash
rm -rf /home/magnetico/Nexus/Nexus-Edu/.cursor/atlassian-mcp-auth
```

## Verificación

Tras auth correcto, `getAccessibleAtlassianResources` (o el equivalente del servidor `atlassian-nexus-edu`) debe listar:

- url: `https://nexus-educacion.atlassian.net`
- cloudId: `c51efaad-12f4-4cac-88b4-4abfa3cabd81`

JQL de smoke: `project = EDU ORDER BY updated DESC`

## Relación con el plugin Atlassian

El plugin marketplace `plugin-atlassian-atlassian` es **global** (misma sesión OAuth en todos los repos). Suele quedar grantado solo a **Feel Ibiza** (`feelibizaproperties`).

En Nexus-Edu:

| Usar | No usar |
|------|---------|
| MCP **`atlassian-nexus-edu`** | Plugin Atlassian si solo lista Feel Ibiza |
| cloudId `c51efaad-12f4-4cac-88b4-4abfa3cabd81` | cloudId `ffa44cf1-…` (Feel) |

### Si el agente dice “solo tiene Feel Ibiza”

1. **Settings → Tools & MCP** → desactivar/ignorar el plugin Atlassian **para este trabajo**, o no usarlo.
2. Habilitar y conectar **`atlassian-nexus-edu`** (proyecto o user `~/.cursor/mcp.json`).
3. OAuth con `gonzalomlopolito@gmail.com` → sitio **`nexus-educacion.atlassian.net`**.
4. Smoke: `getAccessibleAtlassianResources` (del servidor `atlassian-nexus-edu`) debe devolver solo/también `nexus-educacion`.
5. Recargar ventana Cursor si el servidor sigue en `disconnected`.

Workaround estable (Cursor a veces deja el MCP de proyecto en `disconnected`): el servidor también está en `~/.cursor/mcp.json` apuntando a `.cursor/atlassian-mcp-auth/` de este repo.
