import { createApp } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'
import './assets/tokens.css'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'

createApp(App).use(i18n).use(router).mount('#app')
