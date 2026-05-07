# Session Handoff -- Project 02

## Last Session: 2026-05-07

### Status: ✅ TASK.md 三个功能全部通过验收

用户在本地完整跑通 `npm run dev` 的 5 步验收路径，三个功能（导入 / 详情 / 持久化）端到端工作正常。

### What Was Accomplished

- **DocumentDetail 接通内容加载**（`src/renderer/components/DocumentDetail.tsx`）
  - `useEffect`（依赖 `document.id`，带 cancellation guard）调用 `window.knowledgeBase.documents.getContent(document.id)` 写入 `setContent`
  - 容器：`whiteSpace: 'pre-wrap'` + `maxHeight: 420px` + `overflow: 'auto'` + 等宽字体；含 loading / empty / error 三态文案
  - Delete 按钮经 `onDelete` 回到 `App.handleDeleteDocument`，删除后右侧面板清空

- **批量清理 TS 报错**（`npm run check` 0 报错）
  - 三个组件 import 路径 `'../../../shared/types'` → `'../../shared/types'`
  - 删除三个组件里未使用的 `import React`（`QuestionPanel.tsx` 保留，因为它用到 `React.FormEvent`）
  - `StatusBar.tsx` 把 `statusColor` 改成顶层 `Record<AppStatus['indexStatus'], string>` 常量，消掉 TS7053
  - `qa-service.ts` 删未使用的 `Chunk` import

- **删除 `src/renderer/components/ImportPanel.tsx`** -- 已无引用，且 `File.path` 在现代 Electron 下不可用

- **运行时关键修复：`webPreferences.sandbox = false` 显式写出**（`src/main/main.ts`）
  - 不写出时，在 Electron 33 / Windows 上 preload 即使 `contextBridge.exposeInMainWorld` 成功，`window.knowledgeBase.documents.pickFile()` 也会立即抛 `Cannot read properties of undefined (reading 'documents')`
  - 沙盒上下文下 contextBridge 暴露的 API 表现异常；显式 `sandbox: false` 是必须的（不能依赖默认值）
  - 排查路径：临时加 `[preload]/[main]` console.log 与 `webContents.openDevTools` → 确认 preload 加载成功 → 排除编译产物 / 路径问题 → 锁定 sandbox。诊断改动已撤回，仅保留 `sandbox: false`

- **文档同步**
  - `feature_list.json` 三个 feature 全部 `pass`，evidence 写入端到端验证记录
  - `docs/ARCHITECTURE.md` 反映新导入流程（`documents:pick-file` 走 `dialog.showOpenDialog`）、新 IPC 通道（`getContent` / `pickFile`）、删除时连带清理 content/chunks、删除 `ImportPanel` 引用

### Verification

| 验证项 | 结果 |
|---|---|
| `npm run check` | ✅ 0 errors |
| `npm run build` | ✅ 31 modules, ~152 KB pre-gzip |
| `npm test` | ⚠️ 没有测试文件（项目本就没写 Vitest 用例，非回归） |
| TASK.md 5 步验收 | ✅ 用户本地全通过 |

5 步验收路径（全部 ✅）：
1. 启动 → 窗口出现
2. + Import → 选 `.md` → 列表新增
3. 点击 → 元数据 + 完整内容（pre-wrap，可滚动）
4. 关闭 → 重启 → 文档列表与内容仍在
5. Delete → 列表消失 → 重启不复活

### Decisions Made

- `sandbox: false` 写死在 `webPreferences` 里，不依赖 Electron 默认行为。Electron 升级若改默认，配置仍正确。
- 文件选择器走主进程 `dialog.showOpenDialog`，`<input type="file">` + `File.path` 路线已彻底移除。
- 删除文档时同时清理 `content/{id}.txt` 与 `chunks/{id}.json`，符合"重启不复活"的验收标准。

### Files Modified This Session

- `src/main/main.ts` -- 添加 `sandbox: false`
- `src/preload/preload.ts` -- (诊断 log 已撤回，最终无功能变更，与上次会话一致)
- `src/renderer/components/DocumentDetail.tsx` -- 重写：useEffect 加载内容；loading / error / empty 态
- `src/renderer/components/DocumentList.tsx` -- 修 import 路径，删未用 React
- `src/renderer/components/StatusBar.tsx` -- 修 import 路径，删未用 React，statusColor 提到顶层 typed Record
- `src/services/qa-service.ts` -- 删未用 `Chunk` import
- `src/renderer/components/ImportPanel.tsx` -- 删除
- `feature_list.json` -- 三个 feature → `pass` + 端到端 evidence
- `docs/ARCHITECTURE.md` -- 同步导入流程、IPC 通道、组件清单

### What Remains

无。Project 02 starter 的代码工作 + 验收已完结。

### Next Steps

1. 决定是否合 `p02-improved` → `main` / 与 `solution/` 比对差异。
2. 如要进入 Project 03，可在新分支拉 P02 starter 当作起点。
3. 若日后看到 `Cannot read properties of undefined (reading 'documents')` 类错误，第一反应检查 `webPreferences.sandbox` 是否被 Electron 升级或环境改回了 true。
