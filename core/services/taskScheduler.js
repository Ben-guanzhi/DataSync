const schedule = require('node-schedule');
const syncEngine = require('../engine/syncEngine');
const logger = require('./logger');

// 任务调度器
class TaskScheduler {
  constructor() {
    this.jobs = {};
  }
  
  // 初始化任务调度
  init(tasks, dataSources, targets) {
    logger.info('初始化任务调度...');
    
    // 清除现有任务
    this.clearAllJobs();
    
    // 为每个任务创建定时调度
    tasks.forEach(task => {
      this.scheduleTask(task, dataSources, targets);
    });
    
    logger.info(`共调度 ${tasks.length} 个同步任务`);
  }
  
  // 调度单个任务
  scheduleTask(task, dataSources, targets) {
    const { id, name, schedule: cronExpression } = task;
    
    try {
      // 创建定时任务
      const job = schedule.scheduleJob(cronExpression, async () => {
        logger.info(`[${id}] ${name} - 定时任务触发`);
        await syncEngine.executeSyncTask(task, dataSources, targets);
      });
      
      this.jobs[id] = job;
      logger.info(`[${id}] ${name} - 任务调度成功，cron表达式: ${cronExpression}`);
      
    } catch (error) {
      logger.error(`[${id}] ${name} - 任务调度失败: ${error.message}`);
    }
  }
  
  // 清除所有任务
  clearAllJobs() {
    Object.values(this.jobs).forEach(job => {
      job.cancel();
    });
    this.jobs = {};
    logger.info('所有任务已清除');
  }
  
  // 手动触发任务
  async triggerTask(taskId, tasks, dataSources, targets) {
    logger.info(`手动触发任务: ${taskId}`);
    return await syncEngine.triggerSyncTask(taskId, tasks, dataSources, targets);
  }
  
  // 获取所有任务状态
  getJobsStatus() {
    const status = {};
    
    for (const [taskId, job] of Object.entries(this.jobs)) {
      status[taskId] = {
        running: job.running,
        nextInvocation: job.nextInvocation() ? job.nextInvocation().toString() : '无'
      };
    }
    
    return status;
  }
}

module.exports = new TaskScheduler();