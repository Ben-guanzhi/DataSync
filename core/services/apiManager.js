const axios = require('axios');

// 创建axios实例
const createAxiosInstance = (config) => {
  return axios.create({
    timeout: 30000, // 30秒超时
    headers: config.headers || {
      'Content-Type': 'application/json'
    }
  });
};

// 从源系统获取数据
const fetchDataFromSource = async (sourceConfig) => {
  try {
    const instance = createAxiosInstance(sourceConfig);
    
    let response;
    if (sourceConfig.method === 'GET') {
      response = await instance.get(sourceConfig.url, {
        params: sourceConfig.params
      });
    } else if (sourceConfig.method === 'POST') {
      response = await instance.post(sourceConfig.url, sourceConfig.data);
    } else if (sourceConfig.method === 'PUT') {
      response = await instance.put(sourceConfig.url, sourceConfig.data);
    } else if (sourceConfig.method === 'DELETE') {
      response = await instance.delete(sourceConfig.url, {
        data: sourceConfig.data
      });
    } else {
      throw new Error(`不支持的HTTP方法: ${sourceConfig.method}`);
    }
    
    // 提取响应数据
    if (sourceConfig.responsePath) {
      const pathParts = sourceConfig.responsePath.split('.');
      let data = response.data;
      for (const part of pathParts) {
        data = data[part];
        if (data === undefined) {
          throw new Error(`响应路径不存在: ${sourceConfig.responsePath}`);
        }
      }
      return data;
    }
    
    return response.data;
  } catch (error) {
    console.error('从源系统获取数据失败:', error);
    throw error;
  }
};

// 向目标系统推送数据
const pushDataToTarget = async (targetConfig, data) => {
  try {
    const instance = createAxiosInstance(targetConfig);
    
    let response;
    if (targetConfig.method === 'POST') {
      response = await instance.post(targetConfig.url, data);
    } else if (targetConfig.method === 'PUT') {
      response = await instance.put(targetConfig.url, data);
    } else if (targetConfig.method === 'PATCH') {
      response = await instance.patch(targetConfig.url, data);
    } else {
      throw new Error(`不支持的HTTP方法: ${targetConfig.method}`);
    }
    
    // 检查响应状态码
    if (targetConfig.successCode && response.status !== targetConfig.successCode) {
      throw new Error(`目标系统返回错误状态码: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('向目标系统推送数据失败:', error);
    throw error;
  }
};

// 重试机制
const retry = async (fn, maxAttempts, delay) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      return await fn();
    } catch (error) {
      if (attempts === maxAttempts) {
        throw error;
      }
      console.log(`重试 ${attempts}/${maxAttempts}，等待 ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = {
  fetchDataFromSource,
  pushDataToTarget,
  retry
};