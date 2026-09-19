const winston = require('winston');
const path = require('path');

// 配置日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => {
      return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/sync.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 记录同步任务的开始
logger.startSync = (taskId, taskName) => {
  logger.info(`[${taskId}] ${taskName} - 同步任务开始`);
};

// 记录同步任务的成功
logger.syncSuccess = (taskId, taskName, dataCount) => {
  logger.info(`[${taskId}] ${taskName} - 同步成功，同步数据量: ${dataCount}`);
};

// 记录同步任务的失败
logger.syncError = (taskId, taskName, error) => {
  logger.error(`[${taskId}] ${taskName} - 同步失败: ${error.message}`);
};

// 记录数据提取信息
logger.extractData = (taskId, source, dataCount) => {
  logger.info(`[${taskId}] 从 ${source} 提取数据成功，数据量: ${dataCount}`);
};

// 记录数据推送信息
logger.pushData = (taskId, target, dataCount) => {
  logger.info(`[${taskId}] 向 ${target} 推送数据成功，数据量: ${dataCount}`);
};

// 记录重试信息
logger.retry = (taskId, attempt, maxAttempts, error) => {
  logger.warn(`[${taskId}] 第 ${attempt} 次重试，共 ${maxAttempts} 次: ${error.message}`);
};

module.exports = logger;