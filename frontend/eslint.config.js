import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  // 不让 lint 改写 pnpm-workspace.yaml 的安装策略
  pnpm: false,
  ignores: [
    // shadcn-vue 通过 CLI 生成的组件,保持与上游一致,不做 lint
    'src/components/ui/**',
    // 自动生成的类型声明
    'auto-imports.d.ts',
    'components.d.ts',
    'typed-router.d.ts',
  ],
  settings: {
    'import/core-modules': ['vue-router/auto-routes'],
  },
  globals: {
    definePage: 'readonly',
  },
})
