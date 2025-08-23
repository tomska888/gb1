import { promises as fs, PathLike } from 'fs';
import path from 'path';
import { Migrator, MigrationResult } from 'kysely';
import { db } from './config/database.js';
import { WindowsFileMigrationProvider } from './lib/windows-migration-provider.js';
import { fileURLToPath } from 'url';

const SOURCE_MIGRATION_FOLDER = path.join(process.cwd(), 'src/migrations');
const COMPILED_MIGRATION_FOLDER = path.join(fileURLToPath(import.meta.url), '../../dist/migrations');

const MIGRATION_TEMPLATE = `import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Migration code goes here
}

export async function down(db: Kysely<any>): Promise<void> {
  // Migration code goes here
}
`;

async function createMigration(name: string) {
  const timestamp = new Date().getTime();
  const fileName = `${timestamp}_${name}.ts`;
  const filePath = path.join(SOURCE_MIGRATION_FOLDER, fileName);

  try {
    await fs.mkdir(SOURCE_MIGRATION_FOLDER, { recursive: true });
    await fs.writeFile(filePath, MIGRATION_TEMPLATE.trim());
    console.log(`✅ Created migration: ${fileName}`);
  } catch (error) {
    console.error('❌ Failed to create migration file:', error);
    process.exit(1);
  }
}

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new WindowsFileMigrationProvider(COMPILED_MIGRATION_FOLDER),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it: MigrationResult) => {
    if (it.status === 'Success') {
      console.log(`✅ Migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`❌ Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('❌ Failed to migrate');
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  if (command === 'create') {
    const migrationName = process.argv[3];
    if (!migrationName) {
      console.error('❌ Please provide a name for the migration.');
      process.exit(1);
    }
    await createMigration(migrationName);
  } else {
    await migrateToLatest();
  }

  await db.destroy();
}

main();