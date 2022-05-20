import { getCurrentInstance } from "vue";
import { install } from './tcb'
import config from './config'

// @cloudbase/js-sdk 引入全量 SDK
// import cloudbase from "@cloudbase/js-sdk"
// @cloudbase/js-sdk 按需引入功能模块
import cloudbase from '@cloudbase/js-sdk/app'
import '@cloudbase/js-sdk/auth'
import '@cloudbase/js-sdk/functions'
import '@cloudbase/js-sdk/storage'

const isUrl = (s) => {
  return /^http(s)?:\/\//.test(s)
}

async function initTcb (options = {}) {
  const tcb = isUrl(options.envId) ? null : await install(cloudbase, options)
  return tcb
}

/**
 * 云函数请求封装，因此处使用了单例模式，需要传入云函数内的事件名称event
 * @param {Object} tcb Tencent Cloud Base SDK
 * @param {String} event 云函数名称
 * @param {Object} data 云函数参数
 * @returns 云函数返回结果 Object: { requestId, result }
 */
const call = async (tcb, event, data = {}) => {
  const app = getCurrentInstance()?.appContext.config.globalProperties
  const _tcb = tcb || (app ? app.$tcb : null)
  const _envId = data.envId || config.envId
  const _funcName = data.funcName || config.funcName || 'test'
  if (_tcb) {
    try {
      return await _tcb.app.callFunction({
        name: _funcName,
        data: { event, data }
      })
    } catch (e) {
      throw new Error('调用云函数失败')
    }
  } else if (isUrl(_envId)) {
    // 如果是 url 地址，则直接调用
    return await new Promise((resolve, reject) => {
      try {
        const accessToken = localStorage.getItem(`${config.appName}-access-token`)
        const xhr = new XMLHttpRequest()
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              const result = JSON.parse(xhr.responseText)
              if (result.accessToken) {
                localStorage.setItem(`${config.appName}-access-token`, result.accessToken)
              }
              resolve({ result })
            } else {
              reject(xhr.status)
            }
          }
        }
        xhr.open('POST', _envId)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(JSON.stringify({ event, accessToken, ...data }))
      } catch (e) {
        reject(e)
      }
    })
  } else {
    throw new Error('缺少 envId 配置')
  }
}

export {
  isUrl,
  initTcb,
  call
}