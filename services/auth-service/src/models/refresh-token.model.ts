import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '@/db/sequelize'
import { UserCredentials } from './user-credentials.model'

export interface RefreshTokenAttributes {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  userAgent: string | null
  ipAddress: string | null
}

export type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  'id'
>

// rule Model generic sequelize =
// extends Model<TModelAttributes = any, TCreationAttributes = TModelAttributes>
// TModelAttrbutes artinya bentuk data setelah ada di DB
// TCreationAttributes artinya bentuk data saat create
export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare id: string
  declare userId: string
  declare tokenHash: string
  declare expiresAt: Date
  declare revokedAt: Date | null
  declare userAgent: string | null
  declare ipAddress: string | null
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_credentials',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    tokenHash: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    indexes: [
      {
        unique: true,
        name: 'refresh_token_unique_token_hash',
        fields: ['token_hash']
      },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
      { fields: ['revoked_at'] }
    ]
  }
)

UserCredentials.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE'
})

RefreshToken.belongsTo(UserCredentials, {
  foreignKey: 'userId',
  as: 'user'
})
