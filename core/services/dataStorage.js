const { Sequelize, DataTypes } = require('sequelize');

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'data_sync',
  logging: false
});

// 定义同步任务历史模型
const SyncHistory = sequelize.define('SyncHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  taskName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    allowNull: false
  },
  dataCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  errorMessage: {
    type: DataTypes.TEXT
  },
  syncTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  sourceData: {
    type: DataTypes.JSON
  },
  targetData: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'sync_history',
  timestamps: false
});

// 定义重试记录模型
const RetryRecord = sequelize.define('RetryRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  attempt: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  errorMessage: {
    type: DataTypes.TEXT
  },
  retryTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'retry_records',
  timestamps: false
});

// 初始化数据库
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    await SyncHistory.sync({ alter: true });
    await RetryRecord.sync({ alter: true });
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

// 保存同步历史
const saveSyncHistory = async (historyData) => {
  try {
    return await SyncHistory.create(historyData);
  } catch (error) {
    console.error('保存同步历史失败:', error);
    return null;
  }
};

// 保存重试记录
const saveRetryRecord = async (retryData) => {
  try {
    return await RetryRecord.create(retryData);
  } catch (error) {
    console.error('保存重试记录失败:', error);
    return null;
  }
};

// 获取同步历史
const getSyncHistory = async (taskId, limit = 10) => {
  try {
    return await SyncHistory.findAll({
      where: taskId ? { taskId } : {},
      order: [['syncTime', 'DESC']],
      limit
    });
  } catch (error) {
    console.error('获取同步历史失败:', error);
    return [];
  }
};

// 获取重试记录
const getRetryRecords = async (taskId) => {
  try {
    return await RetryRecord.findAll({
      where: { taskId },
      order: [['retryTime', 'DESC']]
    });
  } catch (error) {
    console.error('获取重试记录失败:', error);
    return [];
  }
};

module.exports = {
  initDatabase,
  saveSyncHistory,
  saveRetryRecord,
  getSyncHistory,
  getRetryRecords
};