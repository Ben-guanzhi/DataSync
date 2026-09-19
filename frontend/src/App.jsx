import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  Button,
  Card,
  message,
  Tabs,
  Spin,
  Tag
} from 'antd';

function App() {
  const [tasks, setTasks] = useState([]);
  const [taskStatus, setTaskStatus] = useState({});
  const [history, setHistory] = useState([]);
  const [retryRecords, setRetryRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取所有同步任务
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tasks');
      setTasks(response.data.data);
    } catch (error) {
      message.error('获取任务失败');
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取任务状态
  const fetchTaskStatus = async () => {
    try {
      const response = await axios.get('/api/tasks/status');
      setTaskStatus(response.data.data);
    } catch (error) {
      console.error('获取任务状态失败:', error);
    }
  };

  // 获取同步历史
  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/history');
      setHistory(response.data.data);
    } catch (error) {
      message.error('获取同步历史失败');
      console.error('获取同步历史失败:', error);
    }
  };

  // 获取重试记录
  const fetchRetryRecords = async () => {
    try {
      const response = await axios.get('/api/retry-records');
      setRetryRecords(response.data.data);
    } catch (error) {
      message.error('获取重试记录失败');
      console.error('获取重试记录失败:', error);
    }
  };

  // 手动触发同步任务
  const triggerTask = async (taskId) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/tasks/${taskId}/trigger`);
      if (response.data.success) {
        message.success('任务触发成功');
        // 刷新历史记录
        fetchHistory();
      } else {
        message.error(`任务触发失败: ${response.data.error}`);
      }
    } catch (error) {
      message.error('任务触发失败');
      console.error('任务触发失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchTasks();
    fetchTaskStatus();
    fetchHistory();
    fetchRetryRecords();

    // 定时刷新任务状态
    const interval = setInterval(() => {
      fetchTaskStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 任务列表列定义
  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '数据源',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '目标系统',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: '调度时间',
      dataIndex: 'schedule',
      key: 'schedule',
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const status = taskStatus[record.id];
        if (!status) return '-';
        return (
          <Tag color={status.running ? 'blue' : 'green'}>
            {status.running ? '运行中' : '就绪'}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => triggerTask(record.id)}
          loading={loading}
        >
          手动触发
        </Button>
      ),
    },
  ];

  // 同步历史列定义
  const historyColumns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'success' ? 'green' : 
          status === 'failed' ? 'red' : 'yellow'
        }>
          {status === 'success' ? '成功' : 
           status === 'failed' ? '失败' : '进行中'}
        </Tag>
      ),
    },
    {
      title: '数据量',
      dataIndex: 'dataCount',
      key: 'dataCount',
    },
    {
      title: '同步时间',
      dataIndex: 'syncTime',
      key: 'syncTime',
      render: (syncTime) => new Date(syncTime).toLocaleString(),
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
    },
  ];

  // 重试记录列定义
  const retryColumns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
    },
    {
      title: '重试次数',
      dataIndex: 'attempt',
      key: 'attempt',
    },
    {
      title: '最大尝试次数',
      dataIndex: 'maxAttempts',
      key: 'maxAttempts',
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
    },
    {
      title: '重试时间',
      dataIndex: 'retryTime',
      key: 'retryTime',
      render: (retryTime) => new Date(retryTime).toLocaleString(),
    },
  ];

  return (
    <div className="container">
      <div className="header">
        <h1>数据同步中间件管理</h1>
      </div>

      <Tabs defaultActiveKey="tasks">
        {/* 任务管理 */}
        <Tabs.TabPane tab="任务管理" key="tasks">
          <Card className="card">
            <div className="card-title">同步任务列表</div>
            <Spin spinning={loading}>
              <Table 
                dataSource={tasks} 
                columns={taskColumns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Spin>
          </Card>
        </Tabs.TabPane>

        {/* 同步历史 */}
        <Tabs.TabPane tab="同步历史" key="history">
          <Card className="card">
            <div className="card-title">同步历史记录</div>
            <Spin spinning={loading}>
              <Table 
                dataSource={history} 
                columns={historyColumns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Spin>
          </Card>
        </Tabs.TabPane>

        {/* 重试记录 */}
        <Tabs.TabPane tab="重试记录" key="retry">
          <Card className="card">
            <div className="card-title">重试记录</div>
            <Spin spinning={loading}>
              <Table 
                dataSource={retryRecords} 
                columns={retryColumns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Spin>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default App;