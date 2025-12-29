import { Sequelize } from 'sequelize'
import { env } from '@/config/env'
import { logger } from '@/utils/logger'

export const sequelize = new Sequelize(env.AUTH_DB_URL, {
  dialect: 'mysql',
  logging:
    env.NODE_ENV === 'development'
      ? (msg: unknown) => {
          logger.debug({ sequelize: msg })
        }
      : false,
  define: {
    underscored: true, // dengan ini yang properti defaultnya createdAt menjadi created_at
    freezeTableName: true // utk mencegah sequelize mengubah nama tabel, jadi misal tabel User tidak menjadi Users, melainkan User tetapi User
  }
})

export const connectToDatabase = async () => {
  await sequelize.authenticate()
  logger.info('auth database connection established succesfully')
}

export const closeDatabase = async () => {
  await sequelize.close()
  logger.info('auth database connection closed')
}
