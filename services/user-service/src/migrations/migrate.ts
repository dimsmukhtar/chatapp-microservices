import fs from 'node:fs'
import path from 'node:path'
import { logger } from '@/utils/logger'
import { Client } from 'pg'

export class Migrate {
  private client!: Client
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly user: string,
    private readonly password: string,
    private readonly dbName: string
  ) {}

  private getClient(): Client {
    if (!this.client) {
      throw new Error(
        'database connection not initialized. Call createPostgresqlConnection first.'
      )
    }
    return this.client
  }

  async createPostgresqlConnection(): Promise<void> {
    this.client = new Client({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      database: 'postgres'
    })

    await this.client.connect()
  }

  async createDatabaseIfNotExists(): Promise<void> {
    const client = this.getClient()
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [this.dbName]
    )

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${this.dbName}"`)
      logger.info(`Database '${this.dbName}' created`)
    } else {
      logger.info(`Database '${this.dbName}' already exists`)
    }
    await client.end()
  }
  async startMigratingDatabase(): Promise<void> {
    this.client = new Client({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      database: this.dbName
    })

    await this.client.connect()
    const client = this.getClient()

    const files = fs
      .readdirSync(path.join(__dirname, 'tables'))
      .filter((file) => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      try {
        await client.query('BEGIN')
        await client.query(
          fs.readFileSync(path.join(__dirname, 'tables', file), 'utf8')
        )
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  }

  async closePostgresqlConnection(): Promise<void> {
    if (this.client) {
      await this.client.end()
    }
  }
}
