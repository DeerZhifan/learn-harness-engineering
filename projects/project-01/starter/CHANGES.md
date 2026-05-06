# Knowledge Base 应用关键改动

> 任务：让 starter 中的 Electron 知识库应用真正可运行 —— 左侧文档列表、右侧问答面板、并使用本地数据目录。
> 范围：修复 starter 内已有的类型/路径错误，并补全"+ Import"按钮通过原生文件对话框完成 **导入 → 索引 → 刷新** 的闭环。

## 影响面

```
 src/main/ipc-handlers.ts                       | 23 ++++++++-
 src/main/main.ts                               |  7 +++
 src/preload/preload.ts                         |  3 ++
 src/renderer/App.tsx                           | 54 +++++++++-------------
 src/renderer/components/DocumentDetail.tsx     |  4 +-
 src/renderer/components/DocumentList.tsx       |  3 +-
 src/renderer/components/ImportPanel.tsx        | 31 +++++++------
 src/renderer/components/QuestionPanel.tsx      |  4 +-
 src/renderer/components/StatusBar.tsx          |  8 ++--
 src/renderer/types.d.ts                        | 17 ++++++-
 src/services/qa-service.ts                     |  2 +-
 src/shared/types.ts                            |  3 ++
 12 files changed, 98 insertions(+), 61 deletions(-)
```

## 改动按职责分组

### 1. 新增文件对话框 IPC 通道

`src/shared/types.ts`

```diff
   // App status
   GET_STATUS: 'app:status',
+
+  // Dialog
+  OPEN_FILE_DIALOG: 'dialog:openFile',
 } as const;
```

### 2. 主进程：注册 dialog handler + 注入主窗口引用

`src/main/ipc-handlers.ts`

```diff
-import { IpcMain } from 'electron';
+import { IpcMain, BrowserWindow, dialog } from 'electron';
 ...
 export interface Services {
   documentService: DocumentService;
   indexingService: IndexingService;
   qaService: QaService;
+  getMainWindow: () => BrowserWindow | null;
 }

 export function registerIpcHandlers(ipcMain: IpcMain, services: Services) {
-  const { documentService, indexingService, qaService } = services;
+  const { documentService, indexingService, qaService, getMainWindow } = services;
 ...
+  // Dialog
+  ipcMain.handle(IPC_CHANNELS.OPEN_FILE_DIALOG, async (): Promise<string | null> => {
+    const win = getMainWindow();
+    const options = {
+      title: 'Import Document',
+      properties: ['openFile' as const],
+      filters: [
+        { name: 'Text Documents', extensions: ['txt', 'md', 'markdown'] },
+        { name: 'All Files', extensions: ['*'] },
+      ],
+    };
+    const result = win
+      ? await dialog.showOpenDialog(win, options)
+      : await dialog.showOpenDialog(options);
+    if (result.canceled || result.filePaths.length === 0) return null;
+    return result.filePaths[0];
+  });
 }
```

`src/main/main.ts`

```diff
 let mainWindow: BrowserWindow | null = null;

+function getMainWindow(): BrowserWindow | null {
+  return mainWindow;
+}
 ...
   registerIpcHandlers(ipcMain, {
     documentService,
     indexingService,
     qaService,
+    getMainWindow,
   });
+
+  console.log(`[main] Local data directory: ${dataDir}`);
 }
```

### 3. preload 暴露 dialog API

`src/preload/preload.ts`

```diff
   qa: {
     ask: (question: string) => ipcRenderer.invoke(IPC_CHANNELS.ASK_QUESTION, question),
     history: () => ipcRenderer.invoke(IPC_CHANNELS.GET_HISTORY),
   },
+  dialog: {
+    openFile: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE_DIALOG),
+  },
 };
```

### 4. App.tsx：修 import 路径 + mount 自动刷新 + Import 按钮接到原生对话框

`src/renderer/App.tsx`

```diff
-import React, { useState, useCallback } from 'react';
+import { useState, useCallback, useEffect } from 'react';
 import { DocumentList } from './components/DocumentList';
 import { QuestionPanel } from './components/QuestionPanel';
 import { DocumentDetail } from './components/DocumentDetail';
 import { StatusBar } from './components/StatusBar';
-import { Document, AppStatus, QAResponse } from '../../shared/types';
-
-declare global {
-  interface Window {
-    knowledgeBase: { /* 重复声明，已移除 */ };
-  }
-}
+import { Document, AppStatus, QAResponse, Citation } from '../shared/types';
 ...
-      const status = await window.knowledgeBase.indexing.status();
-      setAppStatus(status);
+      const indexStatus = await window.knowledgeBase.indexing.status();
+      setAppStatus({
+        documentsLoaded: docs.length,
+        indexStatus: indexStatus.status,
+        lastActivity: indexStatus.lastIndexed ?? '',
+      });
   }, []);

+  useEffect(() => {
+    refreshDocuments();
+  }, [refreshDocuments]);
+
   const handleImport = useCallback(async () => {
-    console.log('Import triggered - use window.knowledgeBase.documents.import(filePath)');
-  }, []);
+    try {
+      const filePath = await window.knowledgeBase.dialog.openFile();
+      if (!filePath) return;
+      const doc = await window.knowledgeBase.documents.import(filePath);
+      await window.knowledgeBase.indexing.start(doc.id);
+      await refreshDocuments();
+    } catch (err) {
+      console.error('Import failed:', err);
+    }
+  }, [refreshDocuments]);
 ...
-                    {lastResponse.citations.map((c, i) => (
+                    {lastResponse.citations.map((c: Citation, i: number) => (
```

### 5. 子组件：相对路径修正 + 删除未使用的 React 默认导入

`src/renderer/components/DocumentList.tsx` / `DocumentDetail.tsx` / `StatusBar.tsx`

```diff
-import React from 'react';
-import { Document } from '../../../shared/types';
+import { Document } from '../../shared/types';
```

> 文件位于 `src/renderer/components/`，向上回到 `src/shared/` 是 `../../shared/...`，原本的 `../../../shared/...` 多了一层。
> 因为 tsconfig 用 `react-jsx`，所以 `import React` 不需要；`noUnusedLocals` 会把它当成错误。

`src/renderer/components/QuestionPanel.tsx`

```diff
-import React, { useState } from 'react';
+import { useState, FormEvent } from 'react';
 ...
-  const handleSubmit = (e: React.FormEvent) => {
+  const handleSubmit = (e: FormEvent) => {
```

### 6. StatusBar：解决 TS7053 隐式 any 索引

`src/renderer/components/StatusBar.tsx`

```diff
-  const statusColor = {
+  const colors: Record<AppStatus['indexStatus'], string> = {
     idle: '#888',
     indexing: '#f0ad4e',
     ready: '#5cb85c',
     error: '#d9534f',
-  }[status.indexStatus] ?? '#888';
+  };
+  const statusColor = colors[status.indexStatus] ?? '#888';
```

### 7. ImportPanel：去掉 `file.path`（非标 File 属性），改成调用对话框的按钮

`src/renderer/components/ImportPanel.tsx`

```diff
-import React from 'react';
-
 interface Props {
-  onImport: (filePath: string) => void;
+  onImport: () => void;
 }
 ...
-      <input
-        type="file"
-        accept=".txt,.md"
-        onChange={e => {
-          const file = e.target.files?.[0];
-          if (file) onImport(file.path);
-        }}
-      />
+      <button onClick={onImport}>Choose File…</button>
```

### 8. types.d.ts：补全 dialog 命名空间，并对齐 indexing 的真实返回结构

`src/renderer/types.d.ts`

```diff
       indexing: {
-        start: (documentId?: string) => Promise<import('../shared/types').AppStatus>;
-        status: () => Promise<import('../shared/types').AppStatus>;
+        start: (documentId?: string) => Promise<{
+          status: 'idle' | 'indexing' | 'ready' | 'error';
+          currentIndexed: number;
+          totalDocuments: number;
+          lastIndexed: string | null;
+        }>;
+        status: () => Promise<{
+          status: 'idle' | 'indexing' | 'ready' | 'error';
+          currentIndexed: number;
+          totalDocuments: number;
+          lastIndexed: string | null;
+        }>;
         chunks: (documentId: string) => Promise<import('../shared/types').Chunk[]>;
       };
       qa: {
         ask: (question: string) => Promise<import('../shared/types').QAResponse>;
         history: () => Promise<import('../shared/types').QAHistory[]>;
       };
+      dialog: {
+        openFile: () => Promise<string | null>;
+      };
```

### 9. qa-service：清理未使用的 import

`src/services/qa-service.ts`

```diff
-import { QAResponse, QAHistory, Citation, Chunk } from '../shared/types';
+import { QAResponse, QAHistory, Citation } from '../shared/types';
```

## 一句话总结

修了 6 处坏掉的相对路径 / 未用导入 / 类型推断问题，并把"+ Import"按钮通过新增的 `dialog:openFile` IPC 通道接到 Electron 原生对话框，让 **导入 → 索引 → 刷新** 形成闭环。

## 验证

```sh
npm install
npm run check    # tsc 双 tsconfig 全部通过
npm run build    # tsc + vite build 全部通过
npm run dev      # 启动 Electron，左列表 + 右问答 + 状态栏可用
```

启动后，主进程会在终端打印本地数据目录路径，例如：

```
[main] Local data directory: C:\Users\<user>\AppData\Roaming\knowledge-base\knowledge-base-data
```

该目录下会自动创建 `documents/`、`index/`、`chunks/`、`content/` 等子目录，以及 `documents-meta.json`、`qa-history.json` 等元数据文件。
