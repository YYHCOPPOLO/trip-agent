# 智能旅行助手前端

目录和工具链对齐 [vue-ts-template](https://github.com/YYHCOPPOLO/vue-ts-template)：Vue 3、TypeScript、Vite、文件路由、布局、Pinia、自动导入。

## 目录

- `src/pages`：页面，文件路径即路由
- `src/layouts`：布局，默认 `default.vue`，空布局 `blank.vue`
- `src/router`：把自动路由套上布局后挂载
- `src/stores`：Pinia
- `src/api`：后端请求
- `src/types`：类型
- `src/components`：本地组件，由 `unplugin-vue-components` 自动注册

路由约定见 [docs/router-layout.md](docs/router-layout.md)。

## 脚本

```bash
pnpm dev
pnpm build
pnpm preview
```

复制 `.env.example` 为 `.env.local` 后填写接口地址和高德 Key。
