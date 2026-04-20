import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { ENV } from './config/env';
import { connectDB } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

// Импортируем модели чтобы они зарегистрировались в Sequelize
import './models';

const app = express();

/**
 * Middlewares (Промежуточные слои)
 */

// Безопасность (с настройкой политики для доступа к изображениям извне)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — разрешаем запросы со всех источников (нужно для мобильных приложений)
app.use(cors({ origin: '*' }));

// Логирование запросов в консоль
app.use(morgan('dev'));

// Парсинг входящего JSON и данных из форм
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Статика и Маршруты
 */

// Раздаём загруженные файлы (фотографии пользователей и т.д.) как статические
// Теперь они будут доступны по адресу: http://localhost:3000/uploads/...
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Все основные API роуты
app.use('/api', routes);

// Проверка работоспособности сервера
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'B&A Challenge API работает ✅',
    timestamp: new Date().toISOString()
  });
});

/**
 * Обработка ошибок
 */

// Должен быть самым последним middleware
app.use(errorHandler);

/**
 * Запуск сервера и БД
 */
const startServer = async () => {
  try {
    // Сначала подключаемся к базе данных
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${ENV.PORT}`);
      console.log(`📡 API: http://localhost:${ENV.PORT}/api`);
      console.log(`❤️  Health: http://localhost:${ENV.PORT}/health`);
      console.log(`📁 Static: http://localhost:${ENV.PORT}/uploads`);
    });
  } catch (error) {
    console.error('❌ Не удалось запустить сервер:', error);
    process.exit(1); // Остановить процесс при ошибке запуска
  }
};

startServer();