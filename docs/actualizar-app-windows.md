# Actualizar Nexus-Edu en Windows (sin perder la base)

Guía para docentes y para quien publica versiones. Relacionado: [EDU-22](https://nexus-educacion.atlassian.net/browse/EDU-22).

## Dónde está la base de datos

La SQLite **no** está dentro de la carpeta del programa. Vive en datos de usuario:

`%APPDATA%\nexus-edu\data\nexus-edu.sqlite`

Actualizar (menú o instalador nuevo) **reemplaza solo los archivos de la app**. Esa ruta no se borra.

Antes de cualquier update importante: sidebar → **Respaldar base**.

## Primera vez (PC que ya tiene 1.0.0 sin botón Actualizar)

1. Cerrar Nexus-Edu.
2. Descargar `nexus-edu-1.1.0-setup.exe` desde la [última Release](https://github.com/GyGSol/Nexus-Edu/releases/latest).
3. Instalar encima (mismo usuario Windows).
4. Abrir la app: alumnos y notas deben seguir ahí.
5. A partir de esta versión, el sidebar tiene **Actualizar app**.

Si SmartScreen avisa: *Más información* → *Ejecutar de todas formas*.

## Actualizar desde el menú (1.1.0 en adelante)

1. Abrir Nexus-Edu (versión instalada con NSIS, no el portable suelto).
2. Sidebar → **Actualizar app**.
3. Si hay versión nueva: descarga → reinicia sola.
4. Si ya está al día: mensaje “Ya tenés la última versión…”.

Requisitos: PC con Internet; repo/releases de [GyGSol/Nexus-Edu](https://github.com/GyGSol/Nexus-Edu) accesibles (idealmente **público** para que `electron-updater` lea `latest.yml` sin token embebido).

## Publicar una nueva versión (desarrollo)

1. Subir `version` en `package.json` (semver, p. ej. `1.2.0`).
2. Commit + push a `main`.
3. Crear y pushear tag: `git tag v1.2.0 && git push origin v1.2.0`.
4. GitHub Actions (`.github/workflows/release-windows.yml`) hace `pnpm release:win` y publica la Release con:
   - `nexus-edu-*-setup.exe`
   - `nexus-edu-*-portable.exe`
   - `latest.yml` (necesario para el botón Actualizar)
5. En la PC de prueba: **Actualizar app** o instalar el setup a mano.

Publicación local (opcional, requiere `GH_TOKEN` con permiso `repo`):

```bash
export GH_TOKEN=ghp_...
pnpm release:win
```

## Qué no hacer

- No borrar `%APPDATA%\nexus-edu` al actualizar.
- No cambiar el `appId` (`com.nexus.edu`) sin migrar datos: Electron usaría otra carpeta.
- El **portable** no es el canal principal de auto-update; preferir el instalador NSIS.
