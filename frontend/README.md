# 智能旅行助手前端

目录和工具链对齐 [vue-ts-template](https://github.com/YYHCOPPOLO/vue-ts-template)：Vue 3、TypeScript、Vite、文件路由、布局、Pinia、自动导入。

UI 使用 [shadcn-vue](https://www.shadcn-vue.com/)（基于 reka-ui）+ Tailwind CSS v4，图标使用 `@lucide/vue`，消息提示使用 `vue-sonner`。

## 目录

- `src/pages`：页面，文件路径即路由
- `src/layouts`：布局，默认 `default.vue`，空布局 `blank.vue`
- `src/router`：把自动路由套上布局后挂载
- `src/stores`：Pinia
- `src/api`：后端请求
- `src/types`：类型（`amap.ts` 为高德地图 JS API 的最小类型声明）
- `src/components/ui`：shadcn-vue 组件，由 CLI 生成，尽量不要手改
- `src/components/trip`：行程结果页的业务组件
- `src/composables`：组合式函数（如 `useTripExport` 导出图片/PDF）
- `src/lib`：工具函数（`utils.ts` 的 `cn()`、行程相关常量）

路由约定见 [docs/router-layout.md](docs/router-layout.md)。

## 主题

主题色等设计变量定义在 `src/style.css` 的 `:root` / `.dark` 中（shadcn CSS 变量），给 `<html>` 加上 `dark` 类即可切换暗色。

新增 shadcn-vue 组件：

```bash
pnpm dlx shadcn-vue@latest add <component>
```

## 脚本

```bash
pnpm dev          # 开发服务器
pnpm build        # 类型检查 + 构建
pnpm preview      # 预览构建产物
pnpm type-check   # 仅类型检查
pnpm lint         # ESLint（需要 Node 22+）
```

复制 `.env.example` 为 `.env.local` 后填写接口地址和高德 Key。
