import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: {
      key: fs.readFileSync(path.join(process.cwd(), 'cert', 'privkey1.pem')),
      cert: fs.readFileSync(path.join(process.cwd(), 'cert', 'fullchain1.pem')),
    },
    allowedHosts: [
      'localhost',
      'print.kksoft.kr',
      '.kksoft.kr'  // 서브도메인도 모두 허용
    ]
  }
})
