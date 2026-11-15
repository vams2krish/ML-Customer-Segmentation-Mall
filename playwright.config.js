import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'*.spec.js',
  use:{baseURL:process.env.APP_TEST_URL||'http://127.0.0.1:5173',viewport:{width:1440,height:950},
    channel:process.env.APP_BROWSER_CHANNEL||'chromium'},
  webServer:process.env.APP_TEST_URL?undefined:{command:'npm run dev -- --host 127.0.0.1 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI}
});
