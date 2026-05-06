# Knowledge Base 应用关键改动（commit 25360a4）

> 提交：`25360a4 improved: agent's attempt with minimal harness`
> 作者：DeerZhifan，2026-05-06
> 任务：在最小 harness（AGENTS.md / init.sh / feature_list.json）的引导下，由 agent 修复 starter 中阻塞编译/运行的相对路径与未使用导入问题。
> 范围说明：本文档**不包含** `dist/` 构建产物以及 `package-lock.json` 的变化，仅展示 `src/` 目录下的源码改动。

## 影响面（仅 src）

```
 src/renderer/App.tsx                           | 44 +++++++++-----------
 src/renderer/components/DocumentDetail.tsx     |  4 +-
 src/renderer/components/DocumentList.tsx       |  3 +-
 src/renderer/components/ImportPanel.tsx        |  6 +--
 src/renderer/components/StatusBar.tsx          |  3 +-
 src/services/qa-service.ts                     |  2 +-
 6 files changed, 24 insertions(+), 38 deletions(-)
```

## 改动按职责分组

### 1. App.tsx：删除重复的全局 `Window` 声明 + 修 import 路径 + mount 自动刷新

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
-    knowledgeBase: {
-      documents: {
-        list: () => Promise<Document[]>;
-        import: (filePath: string) => Promise<Document>;
-        get: (id: string) => Promise<Document | null>;
-        delete: (id: string) => Promise<boolean>;
-      };
-      indexing: {
-        start: (documentId?: string) => Promise<{ status: string }>;
-        status: () => Promise<AppStatus>;
-        chunks: (documentId: string) => Promise<Array<{ id: string; content: string; index: number }>>;
-      };
-      qa: {
-        ask: (question: string) => Promise<QAResponse>;
-        history: () => Promise<Array<{ question: string; response: QAResponse }>>;
-      };
-    };
-  }
-}
+import { Document, AppStatus, QAResponse, Citation } from '../shared/types';
```

将 `indexing.status()` 的真实返回结构与组件需要的 `AppStatus` 解耦，并在 mount 时主动刷新一次：

```diff
-      const status = await window.knowledgeBase.indexing.status();
-      setAppStatus(status);
+      const raw = await window.knowledgeBase.indexing.status() as unknown as {
+        status: AppStatus['indexStatus'];
+        totalDocuments: number;
+        lastIndexed: string | null;
+      };
+      setAppStatus({
+        documentsLoaded: raw.totalDocuments ?? docs.length,
+        indexStatus: raw.status ?? 'idle',
+        lastActivity: raw.lastIndexed ?? '',
+      });
     } catch (err) {
       console.error('Failed to refresh documents:', err);
     }
   }, []);

+  useEffect(() => {
+    refreshDocuments();
+  }, [refreshDocuments]);
+
   const handleImport = useCallback(async () => {
     // In a real app this would open a file dialog.
     // For the course, we'll trigger import via the dev console or init script.
```

citations 渲染补上显式参数类型，避免 `noImplicitAny`：

```diff
-                    {lastResponse.citations.map((c, i) => (
+                    {lastResponse.citations.map((c: Citation, i: number) => (
```

### 2. 子组件：相对路径修正 + 删除未使用的 React 默认导入

`src/renderer/components/DocumentDetail.tsx`

```diff
-import React, { useEffect, useState } from 'react';
-import { Document, Chunk } from '../../../shared/types';
+import { useEffect, useState } from 'react';
+import { Document, Chunk } from '../../shared/types';
```

`src/renderer/components/DocumentList.tsx`

```diff
-import React from 'react';
-import { Document } from '../../../shared/types';
+import { Document } from '../../shared/types';
```

`src/renderer/components/StatusBar.tsx`

```diff
-import React from 'react';
-import { AppStatus } from '../../../shared/types';
+import { AppStatus } from '../../shared/types';
```

> 文件位于 `src/renderer/components/`，向上回到 `src/shared/` 应是 `../../shared/...`，原本的 `../../../shared/...` 多了一层。
> 因为 tsconfig 用 `react-jsx`，`import React` 不需要；`noUnusedLocals` 会把它当成错误。

### 3. ImportPanel：去掉 React 默认导入，并以类型断言绕开非标的 `File.path`

`src/renderer/components/ImportPanel.tsx`

```diff
-import React from 'react';
-
 interface Props {
   onImport: (filePath: string) => void;
 }
```

```diff
         onChange={e => {
-          const file = e.target.files?.[0];
-          if (file) onImport(file.path);
+          const file = e.target.files?.[0] as (File & { path?: string }) | undefined;
+          if (file?.path) onImport(file.path);
         }}
```

> 这里 agent 选择最小改动：保留原有的 `<input type="file">`，仅用类型断言让 `file.path` 通过类型检查；并未引入原生 dialog IPC。

### 4. qa-service：清理未使用的 import

`src/services/qa-service.ts`

```diff
-import { QAResponse, QAHistory, Citation, Chunk } from '../shared/types';
+import { QAResponse, QAHistory, Citation } from '../shared/types';
```

## 一句话总结

agent 在最小 harness 引导下，靠**修 5 处坏掉的相对路径** + **去掉未使用的 React/Chunk 导入** + **在 App 里补上 mount 自动刷新与 status 适配**让 starter 通过类型检查与构建；`File.path` 这一非标用法仅做了类型断言绕过，未补 Electron 原生对话框 IPC。

## 验证

```sh
npm install
npm run check    # tsc 双 tsconfig 全部通过
npm run build    # tsc + vite build 全部通过
npm run dev      # 启动 Electron，左列表 + 右问答 + 状态栏可用
```

## 备注：本文档未收录的提交内容

完整 `git show 25360a4` 还包含：

- `projects/project-01/starter/dist/**`：构建产物（已按要求排除）
- `projects/project-01/starter/package-lock.json`：依赖锁文件（2563 行新增，与 src 改动无关，按构建产物范畴排除）
