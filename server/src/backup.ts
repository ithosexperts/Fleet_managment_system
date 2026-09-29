import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getDatabaseDriver, query } from './db';

const execFileAsync = promisify(execFile);
const BACKUPS_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '../../data/backups');

function databaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required.');
  }
  return process.env.DATABASE_URL;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

async function countTable(table: string): Promise<number> {
  const result = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${table}`);
  return Number(result.rows[0]?.count || 0);
}

export async function createBackup(): Promise<{ success: boolean; backupPath: string; stats: any }> {
  if (getDatabaseDriver() === 'sqlserver') {
    throw new Error('SQL Server backups must be configured through the company SQL Server or provider backup policy.');
  }
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  const backupPath = path.join(BACKUPS_DIR, `truck_tracker_backup_${timestamp()}.dump`);

  await execFileAsync('pg_dump', ['--format=custom', '--file', backupPath, databaseUrl()], {
    windowsHide: true
  });

  const [tripCount, userCount, eventCount, fileStats] = await Promise.all([
    countTable('trips'),
    countTable('users'),
    countTable('trip_events'),
    fs.stat(backupPath)
  ]);
  const stats = {
    fileSize: fileStats.size,
    tripCount,
    userCount,
    eventCount,
    createdAt: new Date().toISOString()
  };

  console.log(`[Backup] Created PostgreSQL dump at ${backupPath}`);
  return { success: true, backupPath, stats };
}

export async function restoreBackup(backupPath: string): Promise<boolean> {
  if (getDatabaseDriver() === 'sqlserver') {
    throw new Error('SQL Server restores must be performed through the company SQL Server recovery procedure.');
  }
  await fs.access(backupPath);
  await execFileAsync('pg_restore', ['--clean', '--if-exists', '--dbname', databaseUrl(), backupPath], {
    windowsHide: true
  });
  console.log(`[Restore] Restored PostgreSQL database from ${backupPath}`);
  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';
  const operation = command === 'restore' && args[1]
    ? restoreBackup(args[1])
    : command === 'backup'
    ? createBackup()
    : Promise.reject(new Error('Usage: npx tsx src/backup.ts [backup|restore <file>]'));

  operation.catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
