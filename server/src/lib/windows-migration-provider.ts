import { promises as fs } from "fs";
import path from "path";
import { Migration, MigrationProvider } from "kysely";
import { pathToFileURL } from "url";

export class WindowsFileMigrationProvider implements MigrationProvider {
  private folder: string;

  constructor(folder: string) {
    this.folder = folder;
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};

    try {
      await fs.access(this.folder);
    } catch {
      return {};
    }

    const files = await fs.readdir(this.folder);

    for (const fileName of files) {
      if (fileName.endsWith(".js")) {
        const migrationName = path.parse(fileName).name;

        const migration = await import(
          pathToFileURL(path.join(this.folder, fileName)).href
        );

        migrations[migrationName] = migration;
      }
    }

    return migrations;
  }
}
