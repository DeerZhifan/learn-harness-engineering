# Session Handoff -- Project 03

## Last Session: 2026-05-07

### Status: ✅ 四个 P03 新功能全部实现并通过 npm run dev 端到端启动

按 AGENTS.md 的依赖顺序 metadata-extraction → document-chunking → (indexing-status-ui, grounded-qa) 实现,且先修掉了从 P02 携带过来、阻塞 npm run dev 的运行时问题。

### What Was Accomplished

#### P02 遗留运行时阻塞修复(为后续 dev 验证扫清障碍)

| 问题 | 修复 | 位置 |
|---|---|---|
| `Cannot read properties of undefined (reading 'documents')` | 显式 `webPreferences.sandbox = false` | `src/main/main.ts` |
| `<input type="file">.path` 在现代 Electron 不可用 | 改走主进程 `dialog.showOpenDialog`,新增 `documents:pick-file` IPC | `ImportPanel.tsx` + `ipc-handlers.ts` + `preload.ts` |
| App.tsx 模块解析失败 (`'../../shared/types'`) | 修正为 `'../shared/types'`,删去与 `types.d.ts` 冲突的重复 Window 声明 | `src/renderer/App.tsx` |
| 多个组件 noUnusedLocals 报错 | 删除未使用的 `import React`(QuestionPanel 保留,因用到 `React.FormEvent`) | components |
| StatusBar TS7053 索引报错 | `STATUS_COLOR` / `STATUS_LABEL` 提到顶层 `Record<AppStatus['indexStatus'], string>` | `StatusBar.tsx` |
| qa-service 未用 import | 删除 `Chunk` import | `qa-service.ts` |

#### P03 新功能(按依赖图顺序实现)

1. **metadata-extraction** (`src/services/document-service.ts`, `src/shared/types.ts`)
   - 新增 `DocumentMetadata` 类型(wordCount/lineCount/fileType/paragraphCount/charCount)
   - `DocumentService.extractMetadata()` 在 `importDocument()` 中调用,写入 `Document.metadata`
   - `DocumentDetail` 新增 Metadata 块展示(条件渲染)
   - 删除时同时清理 `chunks/<id>.json`

2. **document-chunking** (`src/services/indexing-service.ts`)
   - `IndexingService` 通过构造函数注入 `DocumentStatusUpdater`
   - `startIndexing()` 完成切分后回写 `Document.status='indexed'` 与 `chunks: count`
   - 单文档分支也写入 `index-meta.json`(此前 baseline 仅批量分支写入)
   - `IndexStatus` 新增 `totalChunks` 字段

3. **indexing-status-ui** (`src/services/indexing-service.ts`, `src/renderer/components/StatusBar.tsx`)
   - `AppStatus` 扩展 `indexedCount` 和 `totalChunks`
   - `IndexingService.getAppStatus()` 计算并返回(IPC `GET_INDEXING_STATUS` 改用此方法)
   - StatusBar 展示 `Index: <Label>`(色点)/ `Documents: N` / `Indexed: x/N` / `Chunks: M` / `Last activity`
   - `App.handleIndexDocument` 在索引后 refresh + 重新拉取选中文档,确保面板看到 `chunks` 数

4. **grounded-qa** (`src/services/qa-service.ts`, `src/renderer/App.tsx`)
   - `QaService` 现在必须注入 `IndexingService`(去除 fallback)
   - 新增两个 mock pattern:`metadata/word/count/line` 和 `confidence/score/citation`
   - 答案面板新增 confidence 徽章:>=0.8 绿色,< 0.8 琥珀色

### Verification

| 验证项 | 结果 |
|---|---|
| `npm run check` | ✅ 0 errors(tsconfig.node.json + tsconfig.json) |
| `npm run build` | ✅ 32 modules, 154.44 KB / 49.06 KB gzipped, 532ms |
| `node scripts/dev.js` (= `npm run dev`) | ✅ tsc → vite build → Electron 启动,exit 0,无 contextBridge/preload 报错 |

> Linux 沙盒中无显示服务,Electron 输出 `Network service crashed` / `GPU process exited` 是正常告警,不影响 main/preload/renderer 加载。Windows 桌面环境会正常出窗。

### Decisions Made

- **`sandbox: false` 写死**:Electron 33 在 Windows/Linux 默认沙盒下,`contextBridge.exposeInMainWorld` 看似成功,但 renderer 拿到的 `window.knowledgeBase` 是 undefined。Electron 官方推荐显式声明,不要依赖默认值。
- **`types.d.ts` 作为 Window.knowledgeBase 的唯一类型源**:App.tsx 内部不再 `declare global`,避免与 `.d.ts` 冲突。新增 IPC(如 `pickFile`)只需更新 `types.d.ts`。
- **`onIndex` 回调而非直接 IPC**:DocumentDetail 的 Index 按钮通过 prop 通知 App 触发索引,App 负责 refreshDocuments + 重新选中文档。这样 chunks 数能立即在 detail 面板可见。
- **`QaService` 依赖必填**:不允许 fallback 创建独立 IndexingService,避免读到不一致的 chunks 状态。

### Files Modified This Session

主进程 / 预加载 / 共享:
- `src/main/main.ts` -- sandbox:false; DI 改为 `new IndexingService(persistence, documentService)` / `new QaService(persistence, indexingService)`
- `src/main/ipc-handlers.ts` -- 新增 `PICK_FILE` handler;`GET_INDEXING_STATUS` 改用 `getAppStatus()`
- `src/preload/preload.ts` -- 新增 `documents.pickFile`
- `src/shared/types.ts` -- 新增 `DocumentMetadata`、`Document.metadata`、`AppStatus.indexedCount/totalChunks`、`IPC_CHANNELS.PICK_FILE`

服务:
- `src/services/document-service.ts` -- `extractMetadata`;`importDocument` 写入 metadata;`deleteDocument` 清理 chunks
- `src/services/indexing-service.ts` -- DI documentService;`startIndexing` 单文档分支写 index-meta;`Document.status`/`chunks` 回写;`IndexStatus.totalChunks`;`getAppStatus`
- `src/services/qa-service.ts` -- 必填 IndexingService;两个 mock pattern;删未用 `Chunk` import

渲染:
- `src/renderer/App.tsx` -- 修 import 路径;删重复 Window 声明;`AppStatus` 初值含新字段;`handleIndexDocument`;confidence 徽章
- `src/renderer/types.d.ts` -- 同步 `pickFile`、Chunk[] 返回
- `src/renderer/components/ImportPanel.tsx` -- 重写为 dialog.showOpenDialog 流程
- `src/renderer/components/StatusBar.tsx` -- 顶层 STATUS_COLOR/STATUS_LABEL Record;新增 Indexed / Chunks 列
- `src/renderer/components/DocumentDetail.tsx` -- 修 import 路径;`onIndex` prop;Metadata 块;chunk wordCount 显示
- `src/renderer/components/DocumentList.tsx` -- 修 import 路径;删未用 React

文档:
- `feature_list.json` -- 4 个新 feature → `pass`,附 evidence;新增 `verification` 块记录 check/build/dev 结果
- `session-handoff.md` -- 本文档

### What Remains

- (可选)在真实 Windows 桌面环境中走一遍完整 5 步验收路径:启动 → Import .md → 看 Metadata + Chunks → Index → 提问看 Citation/Confidence。
- (可选)写少量 Vitest 单测覆盖 `extractMetadata` 与 `chunkDocument` 的边界(空文档、单段、超长段落)。

### Next Steps

1. 与 `p03-baseline` 分支对比,记录 improved harness(One-Feature-at-a-Time + dependency graph + session-handoff)带来的差异。
2. 若日后再遇到 `Cannot read properties of undefined (reading 'documents')`,首先排查 `webPreferences.sandbox` 是否被默认值或环境变量改回 `true`。
