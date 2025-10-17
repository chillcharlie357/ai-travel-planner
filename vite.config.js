import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'
// https://vite.dev/config/
// 动态按需启用 Vue DevTools，避免在 Node 环境触发 localStorage
let devtoolsPlugin = null;
if (process.env.VITE_ENABLE_DEVTOOLS === 'true') {
  const { default: vueDevTools } = await import('vite-plugin-vue-devtools');
  devtoolsPlugin = vueDevTools();
}
export default defineConfig({
  plugins: [
    ...(devtoolsPlugin ? [devtoolsPlugin] : []),
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
