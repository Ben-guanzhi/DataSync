const express = require('express');
const dotenv = require('dotenv');
const syncConfig = require('./config/syncConfig');
const { initDatabase, getSyncHistory, getRetryRecords } = require('./core/services/dataStorage');
const taskScheduler = require('./core/services/taskScheduler');
const logger = require('./core/services/logger');

// 加载环境变量
dotenv.config();

const app = express();
app.use(express.json());

// 初始化数据库
initDatabase();

// 初始化任务调度
taskScheduler.init(syncConfig.syncTasks, syncConfig.dataSources, syncConfig.targets);

// API接口

// 获取所有同步任务
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: syncConfig.syncTasks
  });
});

// 获取任务状态
app.get('/api/tasks/status', (req, res) => {
  const status = taskScheduler.getJobsStatus();
  res.json({
    success: true,
    data: status
  });
});

// 手动触发同步任务
app.post('/api/tasks/:taskId/trigger', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const result = await taskScheduler.triggerTask(
      taskId, 
      syncConfig.syncTasks, 
      syncConfig.dataSources, 
      syncConfig.targets
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// 获取同步历史
app.get('/api/history', async (req, res) => {
  const { taskId, limit = 10 } = req.query;
  
  try {
    const history = await getSyncHistory(taskId, parseInt(limit));
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// 获取重试记录
app.get('/api/retry-records', async (req, res) => {
  const { taskId } = req.query;
  
  try {
    const records = await getRetryRecords(taskId);
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`数据同步中间件已启动，监听端口: ${PORT}`);
  console.log(`数据同步中间件已启动，监听端口: ${PORT}`);
});

module.exports = app;