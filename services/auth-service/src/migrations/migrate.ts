import fs from 'node:fs'
import path from 'node:path'
import { logger } from '@/utils/logger'
import { createConnection, Connection } from 'mysql2/promise'

export class Migrate {
  private connection!: Connection
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly user: string,
    private readonly password: string,
    private readonly dbName: string
  ) {}

  private getConnection(): Connection {
    if (!this.connection) {
      throw new Error(
        'database connection not initialized. Call createMysqlConnection first.'
      )
    }
    return this.connection
  }

  async createMysqlConnection(): Promise<void> {
    this.connection = await createConnection({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password
    })
  }

  async startMigratingDatabase(): Promise<void> {
    const conn = this.getConnection()
    try {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${this.dbName}\``)
      await conn.query(`USE \`${this.dbName}\``)
      logger.info(`✅ Database '${this.dbName}' created and used`)
      await conn.beginTransaction()
      await conn.query(
        fs.readFileSync(
          path.join(__dirname, 'tables', 'user_credentials.sql'),
          'utf8'
        )
      )
      await conn.query(
        fs.readFileSync(
          path.join(__dirname, 'tables', 'refresh_tokens.sql'),
          'utf-8'
        )
      )
      await conn.commit()
      logger.info(
        'user_credentials and refresh_tokens table successfully created'
      )
    } catch (error) {
      await conn.rollback()
      throw error
    }
  }

  async closeMysqlConnection(): Promise<void> {
    await this.connection.end()
  }
}
