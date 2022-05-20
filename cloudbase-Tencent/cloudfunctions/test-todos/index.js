// 三方依赖
const tcb = require('@cloudbase/node-sdk');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data'); // 图片上传
const ipToRegion = require('dy-node-ip2region'); // IP 属地查询

// 云函数 SDK / tencent cloudbase sdk
const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const auth = app.auth();
const db = app.database();
const _ = db.command;

// 初始化 IP 属地
const ipRegionSearcher = ipToRegion.create();

// 常量 / constants
const RES_CODE = {
  SUCCESS: 0,
  FAIL: 1000,
  EVENT_NOT_EXIST: 1001,
  PASS_EXIST: 1010,
  CONFIG_NOT_EXIST: 1020,
  CREDENTIALS_NOT_EXIST: 1021,
  CREDENTIALS_INVALID: 1025,
  PASS_NOT_EXIST: 1022,
  PASS_NOT_MATCH: 1023,
  NEED_LOGIN: 1024,
  FORBIDDEN: 1403,
  AKISMET_ERROR: 1030,
  UPLOAD_FAILED: 1040
};
const ADMIN_USER_ID = 'admin';
const MAX_REQUEST_TIMES = 250;
const requestTimes = {};
const db_collections = ['test-todos']; // 数据库集合

// 云函数入口点 / entry point
exports.main = async (event, context) => {
  console.log('请求ＩＰ：', auth.getClientIP());
  console.log('请求方法：', event.event);
  console.log('请求参数：', event);

  // 因使用的是单例模式，根据传入的event方法名调用对应的函数
  let res = {};
  try {
    protect(); // 安全检查
    switch (event.event) {
      case 'GET_TODOS':
        res = await getTodos(event.data);
        break;
      case 'ADD_TODOS':
        res = await addTodos(event.data);
        break;
      case 'UPDATE_TODOS':
        res = await updateTodos(event.data);
        break;
      case 'REMOVE_TODOS':
        res = await deleteTodos(event.data);
        break;
      case 'REMOVE_COMPLETED':
        res = await removeCompleted(event.data);
        break;
      case 'CHANGE_TODO_STATE':
        res = await changeTodosState(event.data);
        break;
      case 'DELETE_FILE':
        res = await deleteFile(event.data);
        break;
      case 'UPLOAD_FILE':
        res = await uploadFile(event.data);
        break;
      case 'TEST_FUNCTION':
        res = await testFunction(event);
        break;
      default:
        if (event.event) {
          res.code = RES_CODE.EVENT_NOT_EXIST;
          res.message = '云函数不存在';
        } else {
          res.code = RES_CODE.SUCCESS;
          res.message = 'success';
        }
    }
  } catch (e) {
    console.error('云函数异常');
    console.error('请求参数：', event);
    console.error('错误信息：', e);
    res.code = RES_CODE.FAIL;
    res.message = e.message;
  }
  console.log('请求返回：', res);
  return res;
};

// 安全检查
function protect() {
  // 防御
  const ip = auth.getClientIP();
  requestTimes[ip] = (requestTimes[ip] || 0) + 1;
  if (requestTimes[ip] > MAX_REQUEST_TIMES) {
    console.log(`${ip} 当前请求次数为 ${requestTimes[ip]}，已超过最大请求次数`);
    throw new Error('Too Many Requests');
  } else {
    console.log(`${ip} 当前请求次数为 ${requestTimes[ip]}`);
  }
}

// --- 云函数 ---

// 建立数据库 collections
async function createCollections() {
  const collections = db_collections || [];
  const res = {};
  for (const collection of collections) {
    try {
      res[collection] = await db.createCollection(collection);
    } catch (e) {
      console.error('建立数据库失败：', e);
    }
  }
  return res;
}

// 调用云数据库
async function getTodos(params) {
  try {
    const res = await db.collection('test-todos').get();
    console.log('数据库返回', res);
    return res;
  } catch (e) {
    console.error('调用数据库失败：', e);
    const resColl = await createCollections();
    return {
      ...resColl['test-todos'],
      data: []
    };
  }
}

async function addTodos(data) {
  return await db.collection('test-todos').add(data);
}

async function updateTodos(data) {
  let res = await db.collection('test-todos').where({id: data.id}).update(data);
  // if (res.updated === 0) {
  //   res = await db.collection('test-todos').add(data);
  // }
  return res;
}

async function deleteTodos(data) {
  return await db.collection('test-todos').where({id: data.id}).remove();
}

async function removeCompleted(data) {
  return await db.collection('test-todos').where({completed: _.eq(true)}).remove();
}

async function changeTodosState(data) {
  return await db.collection('test-todos').where({completed: _.in([true, false])}).update({
    completed: data.completed
  });
}

// 删除文件
async function deleteFile(data) {
  const fileList = data.ids;
  return await app.deleteFile({
    fileList: fileList
  });
}

// 测试上传文件
async function uploadFile(data) {
  const fileStream = fs.createReadStream(path.join(__dirname, 'photo.png'));
  return await app.uploadFile({
    cloudPath: 'test-todos/photo.png',
    fileContent: fileStream
  });
}

// 调用其它云函数
async function testFunction(params) {
  return await app.callFunction({
    name: 'tags',
    data: {
      x: 1,
      y: 2
    }
  });
}

/**
 * 获取 IP 属地
 * @param detail true 返回省市运营商，false 只返回省
 * @returns {String}
 */
function getIpRegion({ ip, detail = false }) {
  if (!ip) return '';
  try {
    const { region } = ipRegionSearcher.binarySearchSync(ip);
    const [country, , province, city, isp] = region.split('|');
    // 有省显示省，没有省显示国家
    const area = province.trim() ? province : country;
    if (detail) {
      return area === city ? [city, isp].join(' ') : [area, city, isp].join(' ');
    } else {
      return area;
    }
  } catch (e) {
    console.error('IP 属地查询失败：', e);
    return '';
  }
}
