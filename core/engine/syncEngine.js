const logger = require('../services/logger');
const apiManager = require('../services/apiManager');
const { saveSyncHistory, saveRetryRecord } = require('../services/dataStorage');

// 数据转换和映射
const transformAndMapData = (sourceData, fieldMapping, transform) => {
  if (!Array.isArray(sourceData)) {
    sourceData = [sourceData];
  }
  
  return sourceData.map(item => {
    const mappedItem = {};
    
    // 应用字段映射
    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      if (item.hasOwnProperty(sourceField)) {
        let value = item[sourceField];
        
        // 应用转换函数
        if (transform && transform[targetField]) {
          try {
            value = transform[targetField](value);
          } catch (error) {
            console.error(`转换字段 ${targetField} 失败:`, error);
          }
        }
        
        mappedItem[targetField] = value;
      }
    }
    
    return mappedItem;
  });
};

// 执行单个同步任务
const executeSyncTask = async (task, dataSources, targets) => {
  const { id, name, source, target, fieldMapping, transform, retry: retryConfig } = task;
  
  logger.startSync(id, name);
  
  let sourceData = [];
  let targetData = [];
  let error = null;
  
  try {
    // 1. 从源系统获取数据
    const sourceConfig = dataSources[source];
    if (!sourceConfig) {
      throw new Error(`数据源配置不存在: ${source}`);
    }
    
    sourceData = await apiManager.retry(
      () => apiManager.fetchDataFromSource(sourceConfig),
      retryConfig.maxAttempts,
      retryConfig.delay
    );
    
    logger.extractData(id, source, Array.isArray(sourceData) ? sourceData.length : 1);
    
    // 2. 转换和映射数据
    targetData = transformAndMapData(sourceData, fieldMapping, transform);
    
    // 3. 向目标系统推送数据
    const targetConfig = targets[target];
    if (!targetConfig) {
      throw new Error(`目标系统配置不存在: ${target}`);
    }
    
    await apiManager.retry(
      () => apiManager.pushDataToTarget(targetConfig, targetData),
      retryConfig.maxAttempts,
      retryConfig.delay
    );
    
    logger.pushData(id, target, targetData.length);
    logger.syncSuccess(id, name, targetData.length);
    
    // 保存同步历史
    await saveSyncHistory({
      taskId: id,
      taskName: name,
      status: 'success',
      dataCount: targetData.length,
      sourceData: sourceData,
      targetData: targetData
    });
    
  } catch (err) {
    error = err;
    logger.syncError(id, name, err);
    
    // 保存失败的同步历史
    await saveSyncHistory({
      taskId: id,
      taskName: name,
      status: 'failed',
      errorMessage: err.message,
      sourceData: sourceData,
      targetData: targetData
    });
    
    // 保存重试记录
    await saveRetryRecord({
      taskId: id,
      attempt: retryConfig.maxAttempts,
      maxAttempts: retryConfig.maxAttempts,
      errorMessage: err.message
    });
  }
  
  return {
    taskId: id,
    taskName: name,
    status: error ? 'failed' : 'success',
    error: error ? error.message : null,
    dataCount: targetData.length
  };
};

// 批量执行同步任务
const executeSyncTasks = async (tasks, dataSources, targets) => {
  const results = [];
  
  for (const task of tasks) {
    const result = await executeSyncTask(task, dataSources, targets);
    results.push(result);
  }
  
  return results;
};

// 手动触发同步任务
const triggerSyncTask = async (taskId, tasks, dataSources, targets) => {
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    throw new Error(`同步任务不存在: ${taskId}`);
  }
  
  return await executeSyncTask(task, dataSources, targets);
};

module.exports = {
  executeSyncTask,
  executeSyncTasks,
  triggerSyncTask
};