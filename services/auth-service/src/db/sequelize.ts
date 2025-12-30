import { Sequelize } from 'sequelize'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

const AUTH_DB_URL = `mysql://${env.AUTH_DB_USER}:${env.AUTH_DB_PASSWORD}@${env.AUTH_DB_HOST}:${env.AUTH_DB_PORT}/${env.AUTH_DB_NAME}`
export const sequelize = new Sequelize(AUTH_DB_URL, {
  dialect: 'mysql',
  logging:
    env.NODE_ENV === 'development'
      ? (msg: unknown) => {
          logger.debug({ sequelize: msg })
        }
      : false,
  define: {
    underscored: true, // dengan ini yang properti defaultnya createdAt menjadi created_at
    freezeTableName: true, // utk mencegah sequelize mengubah nama tabel, jadi misal tabel User tidak menjadi Users, melainkan User tetapi User
    timestamps: true
  }
})

export const connectToDatabase = async () => {
  await sequelize.authenticate()
  logger.info('mysql auth database connection established succesfully')
}

export const closeDatabase = async () => {
  await sequelize.close()
  logger.info('auth database connection closed')
}
