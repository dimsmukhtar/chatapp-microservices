import { sequelize } from '@/db/sequelize'
import { UserCredentials } from './user-credentials.model'

export const initModels = async () => {
  await sequelize.sync()
}

export { UserCredentials }
