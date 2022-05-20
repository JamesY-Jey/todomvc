import config from '../config'

const isNotSet = (option) => {
  return option === undefined || option === null || option === ''
}

const logger = {
  log: (message, e) => {
    console.log(`${config.appName}: ${message}`, e)
  },
  info: (message, e) => {
    console.info(`${config.appName}: ${message}`, e)
  },
  warn: (message, e) => {
    console.warn(`${config.appName}: ${message}`, e)
  },
  error: (message, e) => {
    console.error(`${config.appName}: ${message}`, e)
  }
}

const builtInOptions = [
  { key: 'envId', required: true }
]

const tcb = {
  sdk: null,
  app: null,
  auth: null
}

async function install (tcbSdk, options = {}) {
  tcb.sdk = tcbSdk
  checkOptions(options)
  tcb.app = tcb.sdk.init({
    env: options.envId,
    region: options.region || 'ap-shanghai'
  })
  await initAuth()
  return tcb
}

// 检查配置项
function checkOptions (options) {
  const missingOptions = []
  for (const option of builtInOptions) {
    if (option.default && isNotSet(options[option.key])) {
      options[option.key] = option.default
    } else if (option.required && isNotSet(options[option.key])) {
      missingOptions.push(option.key)
    }
  }
  if (missingOptions.length > 0) {
    for (const missingOption of missingOptions) {
      logger.warn(`${missingOption} is required`)
    }
    throw new Error(`${config.appName}: failed to init`)
  }
}

async function initAuth () {
  return new Promise((resolve, reject) => {
    tcb.auth = tcb.app.auth({ persistence: 'local' })
    if (tcb.auth.hasLoginState()) {
      resolve()
    } else {
      // 匿名登录
      // signInAnonymously
      tcb.auth
        .anonymousAuthProvider()
        .signIn()
        .then(resolve)
        .catch(reject)
    }
  })
}

export {
  tcb,
  install
}
