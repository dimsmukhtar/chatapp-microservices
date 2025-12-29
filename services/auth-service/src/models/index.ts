import { sequelize } from '@/db/sequelize'
import { UserCredentials } from './user-credentials.model'
import { RefreshToken } from './refresh-token.model'

export const initModels = async () => {
  await sequelize.sync()
  // digunakan untuk menyamakan model dengan database secara otomatis, biasanya hanya dipakai di development.
  // di production jangan pakai sync
  // di production lebih baik pakai sequelize-cli db:migrate
  // digunakan untuk menyamakan model dengan database secara otomatis, biasanya hanya dipakai di development.
}

export { UserCredentials, RefreshToken }
