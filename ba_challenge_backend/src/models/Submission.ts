import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SubmissionAttributes {
  id: number;
  taskId: number;
  userId: number;
  score: number;
  aiScore?: number;
  aiComment?: string;
}

interface SubmissionCreationAttributes
  extends Optional<SubmissionAttributes, 'id' | 'score' | 'aiScore' | 'aiComment'> {}

class Submission extends Model<SubmissionAttributes, SubmissionCreationAttributes>
  implements SubmissionAttributes {
  public id!: number;
  public taskId!: number;
  public userId!: number;
  public score!: number;
  public aiScore?: number;
  public aiComment?: string;
  public readonly createdAt!: Date;
}

Submission.init(
  {
    id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    taskId:   { type: DataTypes.INTEGER, allowNull: false },
    userId:   { type: DataTypes.INTEGER, allowNull: false },
    score:    { type: DataTypes.FLOAT, defaultValue: 0 },
    aiScore:  { type: DataTypes.INTEGER, allowNull: true },
    aiComment:{ type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'submissions', timestamps: true }
);

export default Submission;