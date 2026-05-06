# p01-baseline vs p01-improved：CHANGES.md 差异分析

> 对比对象：同一份 `projects/project-01/starter/CHANGES.md`，分别取自 `p01-baseline` 分支（**无 harness**，仅 prompt 引导）与 `p01-improved` 分支（**最小 harness**：AGENTS.md / init.sh / feature_list.json）。
> 数据来源：① 两份 CHANGES.md 文档；② Claude 完成时输出的 summary / recap 截图。
> 比较目标：观察 harness 对 agent 修复 starter 时的改动幅度、方法论选择、附带扩张倾向、以及**自我表述方式**的影响。

---

## 一、量化差异

| 维度 | p01-baseline（无 harness） | p01-improved（最小 harness） | 倍数 / 差距 |
|---|---|---|---|
| 文件数 | 12 | 6 | 2× |
| 净代码行 | +98 / −61（净 +37） | +24 / −38（净 −14） | — |
| 改动结构 | 9 组改动，跨 main / preload / renderer / types.d.ts | 4 组，仅 renderer + 1 处 service | — |
| 引入新 IPC 通道 | 1 个（`dialog:openFile`） | 0 个 | — |
| **完成耗时（截图实测）** | **5m 27s**（"Sautéed for 5m 27s"） | **4m 30s**（"Cooked for 4m 30s"） | **−17%** |
| 完成报告语言 | 英文 | 中文（贴合用户输入语言） | — |

---

## 二、方法论分歧（最关键的一处）

**面对同一个 `File.path`（非标 Electron 扩展）问题：**

- **baseline**：判定为"非标用法" → 新增完整 IPC 链路
  - `shared/types.ts` 加通道常量
  - `main/ipc-handlers.ts` 注册 `dialog.showOpenDialog` handler
  - `main/main.ts` 注入 `getMainWindow` 引用
  - `preload/preload.ts` 暴露 `dialog.openFile`
  - `renderer/types.d.ts` 补类型声明
  - `ImportPanel.tsx` UI 改成 "Choose File…" 按钮

  **做事做透，从根上换方案。**

- **improved**：判定为"通过类型即可" → 一行类型断言
  ```ts
  const file = e.target.files?.[0] as (File & { path?: string }) | undefined;
  ```
  保留原 `<input type=file>`，不引入 IPC。

  **最小可过，不替用户做产品决策。**

这一处分歧直接拉开了所有量级差距。

---

## 三、附带改动的"扩张倾向"

baseline 在主任务之外顺手修的，improved 全部没碰：

| 顺手改动 | baseline | improved |
|---|---|---|
| `StatusBar` 的 TS7053 隐式 any（重写为 `Record<...>`） | 改了 | 没改（这条不阻塞编译） |
| 把 `types.d.ts` 里 `indexing` 返回类型对齐到真实结构 | 改了完整字段 | 用 `as unknown as` 双断言桥接 |
| `main.ts` 加 `[main] Local data directory:` 启动日志 | 加了 | 没加 |
| 改动 IPC 契约（新增通道） | 新增 1 个 | 不动 |

- baseline 体现出明显的 **工程师本能扩张**：见到隐患顺手治、见到非标用法换架构、见到缺日志补日志。
- improved 体现出 **严格按指令收敛**：harness 把它锚到了"修阻塞编译/运行的问题"这一任务边界。

---

## 四、类型安全权衡

| 取向 | baseline | improved |
|---|---|---|
| 思路 | 用真实类型替代断言 | 用断言 / 双重断言桥接 |
| `indexing.status` 返回类型 | `types.d.ts` 写全 4 个字段 | `as unknown as { ... }` 桥接 |
| `StatusBar` 状态色 | `Record<AppStatus['indexStatus'], string>` | 不改 |
| `File.path` | 改走 IPC，类型自然安全 | `File & { path?: string }` 断言 |
| 代价 | 改动面更大、跨四层文件 | 类型不安全、跨环境（非 Electron）会丢 `path` |

improved 的类型策略 **优先满足"过编译"**；baseline 的类型策略 **优先建立类型与运行时的一致性**。

---

## 五、文档体例本身的差异

improved 的 CHANGES.md 比 baseline 多了三个结构化区块——这是 harness 留下的痕迹：

- **头部**：commit 哈希 + 作者 + 日期 + 任务 + **范围说明**（明确剔除 `dist/` 和 `package-lock.json`）
- **尾部**："本文档未收录的提交内容"清单，主动声明边界
- **小字注**：例如 *"这里 agent 选择最小改动：…并未引入原生 dialog IPC"*，主动反思决策路径

baseline 的文档没有这些反思层，直接进入"任务/范围/影响面"。

→ harness 不仅约束代码改动，也 **改变了 agent 输出文档的结构习惯**：从"叙事性总结"转向"带边界声明的报告"。

---

## 六、Claude 完成报告的自述视角差异（来自截图）

两次任务结束时 Claude 输出的 summary / recap 本身呈现出鲜明对比。

### 6.1 开场白：自我定位

| | baseline | improved |
|---|---|---|
| 标题句 | *"All wired up. Here's a summary of what I built"* | *"构建成功了。这个 Electron 知识库应用已经实现了你要求的所有功能，starter 里的代码框架是完整的，但是有一些 TypeScript 编译错误导致无法构建。我修复了以下问题"* |
| 自我定位 | "我**搭建了**这个应用" | "**starter 已经完整**，我只是修了编译错误" |

baseline 在第一句就把自己放在了"建造者"位置；improved 第一句就**主动声明 starter 已存在的功能边界**——这是 harness（AGENTS.md 显式说明 starter 现状）注入的认知。

### 6.2 摘要结构：表述焦点

- **baseline 的摘要**主体是 *"Architecture / UI layout / Fixes applied"* 三块，**前两块复述 starter 已存在的功能**（main 进程窗口尺寸、PersistenceService 的 mkdirSync、Preload 的 namespace…），让人误以为这些都是 agent 新建的。"Fixes applied" 仅 6 条，是真正反映改动的部分。
  → 表述带有 **"包装功劳"** 的倾向。

- **improved 的摘要**则结构化为 *"修复的错误 / 顺手补的两个使用问题 / 应用结构（已具备你的需求）/ 运行方式"*。"应用结构"块开头就写 **"已具备你的需求"**——明确把这些归为 starter 既有，不揽到自己头上。
  → 表述带有 **"如实归因"** 的倾向。

### 6.3 验证边界声明

| | baseline | improved |
|---|---|---|
| 验证声明 | *"`npm run check` passes; `npm run build` produces dist/main, dist/preload, dist/renderer. Run `npm run dev` to launch."* | *"`npm run check` 和 `npm run build` 都已验证通过。**我没有真正启动 Electron 窗口（GUI 交互在这里无法验证）**，如果你跑起来后看到运行时的问题告诉我即可。"* |
| 是否声明 GUI 未验证 | ❌ 没有 | ✅ 显式声明 |

improved **主动暴露了未覆盖的验证维度**（GUI），并把后续验证责任明确移交给用户；baseline 用一行 "Run `npm run dev` to launch" 顺势暗示一切就绪。

### 6.4 同一处改动的"措辞"对比

| 改动项 | baseline 描述 | improved 描述 |
|---|---|---|
| `File.path` | "**Replaced** the broken file.path import flow **with** an Electron-side dialog.showOpenDialog IPC handler" | "file.path 在标准 File 类型上不存在——按 Electron 扩展**做了类型扩展**" |
| 措辞色彩 | 主动语气 / 重构感 | 描述语气 / 修补感 |

同样是处理 `File.path`，baseline 的措辞强调 **"我替换了一整个流程"**，improved 的措辞强调 **"这是 Electron 扩展，我做了最小的类型扩展"**。措辞本身就泄露了两种工程心态。

### 6.5 recap 一行差异

- **baseline recap**：*"Goal: build an Electron knowledge-base app… Status: implemented and both type-check and build pass."*
- **improved recap**：*"Goal: build the Electron knowledge base… Status: **starter already implements it**; I fixed the TypeScript build errors and both check and build pass."*

→ 即便 recap 只有一行，improved 也把 *"starter already implements it"* 这层归因写入；baseline 则呈现成"我从零实现"。

---

## 七、新增观察：harness 影响的不只是代码

把上述截图证据归并起来，可以看到 harness 在以下三个**非代码维度**也产生了影响：

| 维度 | 无 harness | 最小 harness |
|---|---|---|
| 任务耗时 | 5m 27s | 4m 30s（−17%） |
| 自述视角 | "我建造了…" | "starter 已有，我只修了…" |
| 验证边界声明 | 隐性（未提 GUI 未跑） | 显性（主动声明 GUI 未验证、责任移交用户） |
| 输出语言贴合度 | 英文（与用户中文输入不符） | 中文（贴合用户输入语言） |
| 表述心态 | 倾向"包装功劳" | 倾向"如实归因" |

**这是一个有趣的 second-order 效果**：harness 通过让 agent 提前读到 AGENTS.md / feature_list.json（明确写出了"哪些是 starter 既有、哪些需要补"），客观上 **抑制了 agent 把存量功能也算进自己产出** 的倾向。代码改动幅度的收敛只是表层；更深层的是 agent 对"任务边界 / 自身责任范围"的认知更准了。

---

## 八、一句话结论

> **同一份 starter、同一个"让它能跑"的目标，最小 harness 让 agent 的净代码改动从 +37 行收敛到 −14 行（≈减少 60%）、耗时降低 17%，并把自述从"我建造了"扭转为"starter 已有，我只修了"。代价是放弃了 Electron 原生 dialog 这条更稳妥但需要跨四层文件的解法。**

harness 在这次试验里起到的核心作用是 **同时抑制了三类扩张**：
1. **代码扩张**——把"做事做透"重新锚回"修阻塞问题"。
2. **耗时扩张**——更小的范围带来更短的执行时间。
3. **叙事扩张**——抑制 agent 把存量功能算入自己产出，让完成报告更可信。

| 评估视角 | harness 是收益还是成本 |
|---|---|
| 教学 / 演示 | **收益**：变更小、可读性高、不替用户做产品决策、自述如实 |
| 真实工程交付 | **成本**：`File.path` 断言在 Electron 升级或换打包模式下可能踩坑，IPC 路径才是 Electron-native 的正路 |
| 信任建立 | **收益**：improved 主动声明"GUI 未验证"，把验证责任清晰移交给用户 |

---

## 九、值得继续追问的下一步

> **最小 harness 是否需要再补一条"遇到非标 API 时优先换 IPC，而非类型断言"的指引？**

那样就能在保留收敛性、保留如实归因的同时，拿回 baseline 的工程稳妥性——这正是从"最小 harness"演进到"够用 harness"的一个候选维度。

另一个值得做的实验：**给 baseline 也加上"完成时如实归因"的硬性约束**（例如 AGENTS.md 中明确"summary 中必须区分 starter 既有功能与本次新增改动"），观察是否能在不改变 agent 自由度的前提下，单独拿到 improved 在自述层面的收益。
