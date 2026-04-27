// ============================================================
// ФАЙЛ 1: ba_challenge_backend/src/models/Challenge.ts
// Добавь поле password в модель
// ============================================================

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ChallengeStatus, VisibilityLevel } from '../types';

interface ChallengeAttributes {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  creatorId: number;
  status: ChallengeStatus;
  visibility: VisibilityLevel;
  betAmount: number;
  familyOwnerId?: number;
  password?: string;        // ✅ НОВОЕ поле для защищённых челленджей
}

interface ChallengeCreationAttributes
  extends Optional<ChallengeAttributes, 'id' | 'status' | 'betAmount' | 'password'> { }

class Challenge extends Model<ChallengeAttributes, ChallengeCreationAttributes>
  implements ChallengeAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public startDate!: Date;
  public endDate!: Date;
  public creatorId!: number;
  public status!: ChallengeStatus;
  public visibility!: VisibilityLevel;
  public betAmount!: number;
  public password?: string;   // ✅
  public readonly createdAt!: Date;
  familyOwnerId: any;
}

Challenge.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    creatorId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('active', 'pending', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    visibility: {
      type: DataTypes.ENUM('secret', 'protected', 'public'),
      defaultValue: 'protected',
    },
    betAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
    familyOwnerId: { type: DataTypes.INTEGER, allowNull: true },
    password: { type: DataTypes.STRING(255), allowNull: true },   // ✅ НОВОЕ
  },
  { sequelize, tableName: 'challenges', timestamps: true }
);

export default Challenge;