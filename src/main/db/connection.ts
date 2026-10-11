import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

export function getDbPath(): string {
  const dir = join(app.getPath('userData'), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'nexus-edu.sqlite')
}

function migrateAssessmentsDimensionKey(database: Database.Database): void {
  const cols = database.prepare('PRAGMA table_info(assessments)').all() as Array<{ name: string }>
  if (!cols.length || cols.some((c) => c.name === 'dimension_key')) return

  database.exec(`
    CREATE TABLE assessments_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      bimester INTEGER NOT NULL,
      area TEXT NOT NULL,
      dimension_key TEXT NOT NULL DEFAULT '',
      detail_marks TEXT NOT NULL DEFAULT '',
      grade TEXT NOT NULL DEFAULT '',
      UNIQUE(student_id, bimester, area, dimension_key)
    );
    INSERT INTO assessments_new (id, student_id, bimester, area, dimension_key, detail_marks, grade)
    SELECT id, student_id, bimester, area, '', detail_marks, grade FROM assessments;
    DROP TABLE assessments;
    ALTER TABLE assessments_new RENAME TO assessments;
  `)
}

function migratePhraseCatalogMeta(database: Database.Database): void {
  const cols = database.prepare('PRAGMA table_info(phrase_catalog)').all() as Array<{ name: string }>
  if (!cols.length) return
  const names = new Set(cols.map((c) => c.name))
  if (!names.has('grade_hint')) {
    database.exec(`ALTER TABLE phrase_catalog ADD COLUMN grade_hint TEXT NOT NULL DEFAULT ''`)
  }
  if (!names.has('area')) {
    database.exec(`ALTER TABLE phrase_catalog ADD COLUMN area TEXT NOT NULL DEFAULT ''`)
  }
}

export function getDb(): Database.Database {
  if (db) return db
  const path = getDbPath()
  db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)
  migrateAssessmentsDimensionKey(db)
  migratePhraseCatalogMeta(db)
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function dbExistsWithStudents(): boolean {
  const database = getDb()
  const row = database.prepare('SELECT COUNT(*) AS c FROM students').get() as { c: number }
  return row.c > 0
}
