import { Migrate } from '@/migrations/migrate'
import { env } from '@/config/env'

const migrate = new Migrate(
  env.AUTH_DB_HOST,
  env.AUTH_DB_PORT,
  env.AUTH_DB_USER,
  env.AUTH_DB_PASSWORD,
  env.AUTH_DB_NAME
)

async function executeMigration() {
  await migrate.createMysqlConnection()
  await migrate.startMigratingDatabase()
  await migrate.closeMysqlConnection()
}

executeMigration()
