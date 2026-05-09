import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SubmissionMediaAttributes {
  id: number;
  submissionId: number;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  order: number;
}

interface SubmissionMediaCreationAttributes
  extends Optional<SubmissionMediaAttributes, 'id' | 'order'> {}

class SubmissionMedia extends Model<SubmissionMediaAttributes, SubmissionMediaCreationAttributes>
  implements SubmissionMediaAttributes {
  public id!: number;
  public submissionId!: number;
  public mediaUrl!: string;
  public mediaType!: 'photo' | 'video';
  public order!: number;
  public readonly createdAt!: Date;
}

SubmissionMedia.init(
  {
    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    submissionId: { type: DataTypes.INTEGER, allowNull: false },
    mediaUrl:     { type: DataTypes.STRING(500), allowNull: false },
    mediaType:    { type: DataTypes.ENUM('photo', 'video'), allowNull: false },
    order:        { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { sequelize, tableName: 'submission_media', timestamps: true }
);

export default SubmissionMedia;