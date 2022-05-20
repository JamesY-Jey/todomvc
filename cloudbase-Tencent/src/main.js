import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { tcb } from './utils/tcb'

const app = createApp(App)

app.config.globalProperties.$tcb = tcb

app.use(router)

app.mount('#app')
