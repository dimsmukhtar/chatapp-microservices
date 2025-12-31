import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '@/db/sequelize'

export interface UserCredentialsAttributes {
  id: string
  email: string
  displayName: string
  passwordHash: string
}

export type UserCredentialsCreationAttributes = Optional<
  UserCredentialsAttributes,
  'id'
>

// rule Model generic sequelize =
// extends Model<TModelAttributes = any, TCreationAttributes = TModelAttributes>
// TModelAttrbutes artinya bentuk data setelah ada di DB
// TCreationAttributes artinya bentuk data saat create
export class UserCredentials
  extends Model<UserCredentialsAttributes, UserCredentialsCreationAttributes>
  implements UserCredentialsAttributes
{
  declare id: string
  declare email: string
  declare displayName: string
  declare passwordHash: string

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

UserCredentials.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'user_credentials',
    indexes: [
      {
        unique: true,
        name: 'user_credentials_unique_email',
        fields: ['email']
      }
    ]
  }
)
