import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("goals")
    .addColumn("category", "text")
    .addColumn("tags", "text")
    .addColumn("color", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("goals").dropColumn("color").execute();
  await db.schema.alterTable("goals").dropColumn("tags").execute();
  await db.schema.alterTable("goals").dropColumn("category").execute();
}
