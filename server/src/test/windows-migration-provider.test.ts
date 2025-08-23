import { describe, it, expect } from 'vitest';
import { WindowsFileMigrationProvider } from '../lib/windows-migration-provider.js';
import fs from 'fs/promises';
import path from 'path';

const TEST_MIGRATION_DIR = path.join(__dirname, '__test_migrations__');

describe('WindowsFileMigrationProvider', () => {
  it('returns empty if folder does not exist', async () => {
    const provider = new WindowsFileMigrationProvider('./nonexistent_folder');
    const result = await provider.getMigrations();
    expect(result).toEqual({});
  });

  it('loads valid .js migrations', async () => {
    await fs.mkdir(TEST_MIGRATION_DIR, { recursive: true });
    const jsFile = path.join(TEST_MIGRATION_DIR, '001_test-migration.js');
    await fs.writeFile(jsFile, 'export const up = () => {}; export const down = () => {};');

    const provider = new WindowsFileMigrationProvider(TEST_MIGRATION_DIR);
    const result = await provider.getMigrations();
    expect(result).toHaveProperty('001_test-migration');

    await fs.rm(TEST_MIGRATION_DIR, { recursive: true, force: true });
  });
});