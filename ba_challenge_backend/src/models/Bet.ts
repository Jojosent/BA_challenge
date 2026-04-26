import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Статус ставки
export type BetStatus =
  | 'pending'   // ждёт подтверждения от цели
  | 'active'    // принята, монеты заблокированы
  | 'declined'  // цель отклонила
  | 'cancelled' // создатель отменил (до принятия)
  | 'won'       // создатель выиграл
  | 'lost';     // создатель проиграл

interface BetAttributes {
  id: number;
  challengeId: number;
  fromUserId: number;   // кто ставит
  toUserId: number;     // на кого ставит (должен проиграть / выиграть)
  targetUserId: number; // кто должен победить по мнению создателя ставки
  amount: number;       // сколько монет ставит fromUser
  description: string;  // условие ставки текстом
  status: BetStatus;
  winnerId?: number;    // кто забрал монеты
}

interface BetCreationAttributes
  extends Optional<BetAttributes, 'id' | 'status' | 'winnerId'> {}

class Bet extends Model<BetAttributes, BetCreationAttributes>
  implements BetAttributes {
  public id!: number;
  public challengeId!: number;
  public fromUserId!: number;
  public toUserId!: number;
  public targetUserId!: number;
  public amount!: number;
  public description!: string;
  public status!: BetStatus;
  public winnerId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Bet.init(
  {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    challengeId: { type: DataTypes.INTEGER, allowNull: false },
    fromUserId:  { type: DataTypes.INTEGER, allowNull: false },
    toUserId:    { type: DataTypes.INTEGER, allowNull: false },
    targetUserId:{ type: DataTypes.INTEGER, allowNull: false },
    amount:      { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'declined', 'cancelled', 'won', 'lost'),
      defaultValue: 'pending',
    },
    winnerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'bets', timestamps: true }
);

export default Bet;