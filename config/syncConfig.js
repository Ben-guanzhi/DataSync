// 同步任务配置
module.exports = {
  // 数据源配置
  dataSources: {
    source1: {
      type: 'api',
      url: 'https://api.source.com/data',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {},
      responsePath: 'data' // 响应数据的路径
    },
    source2: {
      type: 'api',
      url: 'https://api.another-source.com/data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {{token}}'
      },
      data: {
        page: 1,
        limit: 100
      },
      responsePath: 'result.items'
    }
  },
  
  // 目标系统配置
  targets: {
    target1: {
      type: 'api',
      url: 'https://api.target.com/sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {{token}}'
      },
      successCode: 200
    },
    target2: {
      type: 'api',
      url: 'https://api.another-target.com/sync',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      successCode: 201
    }
  },
  
  // 同步任务配置
  syncTasks: [
    {
      id: 'task1',
      name: '用户数据同步',
      source: 'source1',
      target: 'target1',
      schedule: '0 */5 * * * *', // 每5分钟执行一次
      fieldMapping: {
        'id': 'userId',
        'name': 'userName',
        'email': 'userEmail',
        'phone': 'userPhone'
      },
      transform: {
        'userName': (value) => value.toUpperCase(),
        'userEmail': (value) => value.toLowerCase()
      },
      retry: {
        maxAttempts: 3,
        delay: 5000 // 5秒
      }
    },
    {
      id: 'task2',
      name: '订单数据同步',
      source: 'source2',
      target: 'target2',
      schedule: '0 */10 * * * *', // 每10分钟执行一次
      fieldMapping: {
        'orderId': 'id',
        'customerName': 'customer',
        'amount': 'totalAmount',
        'status': 'orderStatus'
      },
      transform: {
        'totalAmount': (value) => parseFloat(value),
        'orderStatus': (value) => value === 'pending' ? '待处理' : value === 'completed' ? '已完成' : '其他'
      },
      retry: {
        maxAttempts: 5,
        delay: 10000 // 10秒
      }
    }
  ]
};