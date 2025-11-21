import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/main.css' // подключаем bootstrap через main.css

// Подключаем bootstrap JS (для collapse и т.д.)
import 'bootstrap/dist/js/bootstrap.bundle'

createApp(App).use(router).mount('#app')
