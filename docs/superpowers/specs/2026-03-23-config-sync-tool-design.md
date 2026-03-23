# Claude / Codex 配置同步工具设计文档

- 日期：2026-03-23
- 项目目录：`D:\git\config-sync-tool`
- 文档类型：技术方案 / MVP 设计
- 当前阶段：方案确认后落文，不含实现代码

## 1. 背景

在 Claude 与 Codex 之间切换使用时，常见需要手动迁移以下内容：

- 基础运行配置（model、approval、sandbox、reasoning 等）
- 规则文件与系统指令（如 `CLAUDE.md`、rules、instruction 文件）
- skills / agents 定义
- MCP server 配置
- 输出风格与响应格式约束

现状问题：

1. 两边配置格式不同，不能直接拷贝。
2. 部分能力语义相近但字段不兼容，需要人工判断。
3. 项目级配置、用户级配置、运行时覆盖项容易冲突。
4. 切换工具时重复劳动多，且容易遗漏关键规则。

目标是设计一个本地工具，实现 Claude 与 Codex 之间的双向配置同步与迁移辅助，尽量降低手工维护成本。

## 2. 目标与非目标

### 2.1 目标

第一版目标：

- 支持 **本地双向同步**：Claude → Codex、Codex → Claude
- 支持 **宽松模式**：尽量自动转换，无法完全映射时输出告警与跳过清单
- 支持统一扫描、解析、归一化、diff、预览、落地流程
- 支持以下对象的同步或迁移建议：
  - 基础运行配置
  - 规则文件 / 指令集
  - MCP 配置
  - skills 元信息
  - agents 元信息
  - 输出风格
- 提供 dry-run、backup、report 能力

### 2.2 非目标

第一版不承诺：

- 所有 skill / agent 的 100% 无损等价迁移
- 跨云端账号或远程配置中心同步
- 自动推断所有隐式行为
- 接管工具内部私有运行时逻辑

## 3. 设计原则

1. **不直接硬拷贝原始文件**，必须先解析再转换。
2. **以统一中间模型为核心**，避免双边互转逻辑爆炸。
3. **不覆盖未知字段**，尽量保留目标端已有配置。
4. **先 diff 再落地**，默认支持 dry-run。
5. **所有不可映射项必须可见**，禁止 silent fail。
6. **本地优先、最小闭环优先**，先解决实际切换痛点。

## 4. 候选方案对比

### 4.1 方案 A：直接文件互转

做法：Claude 配置直接转 Codex，Codex 反向同理。

优点：

- 开发快
- PoC 成本低

缺点：

- 配置对象一多就难维护
- 规则、skills、agents、output style 很难优雅处理
- 后续扩展到第三种工具时会快速失控

结论：

- 仅适合 PoC，不适合作为正式架构

### 4.2 方案 B：统一中间模型 + 双适配器

做法：

- Claude/Codex 配置先解析为统一模型 `UnifiedConfig`
- 再由目标端适配器输出为 Claude 或 Codex 可接受的格式
- 不兼容项进入 `warnings` / `skipped` / `manualActions`

优点：

- 结构稳定
- 适合双向同步
- 便于后续扩展到更多工具
- 能做语义级映射，而不是字符串替换

缺点：

- 第一版设计成本较高
- 需要先定义领域模型

结论：

- **推荐方案**

### 4.3 方案 C：统一配置仓格式 + 各工具生成器

做法：

- 用户维护一份平台无关配置
- Claude/Codex 配置由生成器产出

优点：

- 长期最干净
- 便于团队标准化

缺点：

- 第一版不适合当前“从现有配置迁移”的诉求
- 会增加第三套配置源的维护成本

结论：

- 适合作为第二阶段演进方向

## 5. 最终方案

采用 **方案 B：统一中间模型 + 双适配器**。

同时预留向方案 C 演进的能力：

- 当前阶段：以扫描本机现有 Claude / Codex 配置为主
- 后续阶段：允许导出为平台无关的标准配置文件

## 6. 核心架构

建议拆为 5 层：

### 6.1 Scanner

负责发现本地配置源：

- Claude 用户级配置目录
- Claude 项目级配置目录
- Codex 用户级配置目录
- Codex 项目级配置目录
- skills / rules / agents / MCP 配置目录

输出：待解析文件列表 + 来源信息。

### 6.2 Parser

负责读取并解析不同格式：

- JSON
- TOML
- YAML
- Markdown
- 特定约定文件（如 `CLAUDE.md`、skills 元数据、agent 定义）

输出：平台相关的原始结构化对象。

### 6.3 Normalizer

负责将平台相关对象归一化为统一模型 `UnifiedConfig`。

职责：

- 统一字段名
- 统一枚举语义
- 标记来源和作用域
- 提取可迁移对象与不可迁移对象

### 6.4 Mapper

负责目标平台映射：

- `Claude -> Unified`
- `Codex -> Unified`
- `Unified -> Claude`
- `Unified -> Codex`

职责：

- 字段映射
- 枚举转换
- 能力降级
- 不兼容说明
- 手工动作建议生成

### 6.5 Planner / Applier

负责生成同步计划并落地：

- 计算 diff
- 生成预览
- 输出告警
- 备份原文件
- 写入目标文件
- 输出最终报告

## 7. 统一领域模型

建议内部标准模型如下：

```ts
type UnifiedConfig = {
  profile: {
    model?: string
    approvalPolicy?: string
    sandboxMode?: string
    reasoningEffort?: string
    outputStyle?: string
    responseStorage?: 'enabled' | 'disabled'
    env?: Record<string, string>
  }
  instructions: {
    systemRules: RuleItem[]
    outputRules: RuleItem[]
    safetyRules: RuleItem[]
    projectRules: RuleItem[]
  }
  skills: SkillItem[]
  agents: AgentItem[]
  mcps: McpServerItem[]
  hooks: HookItem[]
  metadata: {
    source: 'claude' | 'codex'
    scope: 'user' | 'project'
    files: string[]
  }
}
```

配套对象建议：

```ts
type RuleItem = {
  id: string
  title: string
  category: 'system' | 'output' | 'safety' | 'language' | 'project'
  content: string
  priority?: number
  portable?: boolean
}

type SkillItem = {
  name: string
  description?: string
  trigger?: string[]
  entry?: string
  portability: 'native' | 'portable' | 'manual'
  notes?: string[]
}

type AgentItem = {
  name: string
  role?: string
  trigger?: string[]
  tools?: string[]
  mode?: 'serial' | 'parallel'
  portability: 'native' | 'template' | 'manual'
}

type McpServerItem = {
  name: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  transport?: 'stdio' | 'http' | 'sse' | 'unknown'
  enabled?: boolean
  scope?: 'user' | 'project'
}

type HookItem = {
  name: string
  event: string
  command: string
  enabled?: boolean
  portability: 'portable' | 'manual'
}
```

## 8. 同步对象拆分

第一版按 6 类对象处理。

### 8.1 基础运行配置

包括：

- model
- approval policy
- sandbox mode
- reasoning effort
- response storage
- env

说明：

- 这部分最适合优先做自动同步
- 要求字段映射清晰、差异可告警

### 8.2 输出风格

包括：

- Claude `outputStyle`
- Codex personality / response style
- 自定义输出模板

处理策略：

- 不做生硬文本复制
- 统一抽象成：风格名称、语气约束、结构约束、禁止项
- 若目标平台无原生支持，则转成 instruction patch，并给出告警

### 8.3 Rules / 系统指令

包括：

- `CLAUDE.md`
- rules 目录
- instruction 文件
- 项目规则、语言规则、安全规则、输出规则

处理策略：

- 先分类，再合并
- 保留优先级链：`global > project > runtime override`
- 无法自动切片时，保底迁移为文本规则块

### 8.4 Skills

包括：

- skill 名称
- 说明
- 触发条件
- 入口信息

处理策略：

- 第一版以元信息同步为主
- 对工具调用方式差异较大的 skill，仅输出模板或 manual 提示
- 每个 skill 标记 `native / portable / manual`

### 8.5 Agents

包括：

- agent 名称
- 角色职责
- 触发条件
- 工具权限
- 编排方式

处理策略：

- 第一版先支持元信息提取与目标端模板生成
- 不保证完整运行时行为等价
- 对依赖特定平台调度能力的 agent 标记 `template` 或 `manual`

### 8.6 MCP

包括：

- server name
- command / args
- env
- transport
- enabled
- scope

处理策略：

- 作为第一版重点能力
- 尽量做到高保真同步
- 对 transport 差异与私有认证方式输出告警

## 9. 不兼容处理与结果模型

由于采用宽松模式，结果分为三类：

```ts
type SyncResult = {
  applied: ChangeItem[]
  warnings: WarningItem[]
  skipped: SkippedItem[]
  manualActions: ManualAction[]
}
```

含义：

- `applied`：已安全映射并成功落地
- `warnings`：已部分映射，但语义存在差异
- `skipped`：无法安全自动处理，因此跳过
- `manualActions`：建议用户补做的动作

示例：

- Claude 的某个 `outputStyle` 在 Codex 无原生等价项
  - 结果：转成 personality + instruction patch
  - 同时写入 `warnings`
- 某个依赖 Claude Skill Tool 运行时的 skill
  - 结果：写入 `manualActions`

## 10. 同步流程

建议执行链如下：

1. 扫描配置源
2. 解析源文件
3. 归一化为统一模型
4. 计算源与目标差异
5. 生成同步计划
6. 输出 dry-run 预览
7. 备份目标文件
8. 应用变更
9. 生成报告

### 10.1 双向同步模式

双向同步不能简单“互相覆盖”，建议采用：

- 先分别解析 Claude 与 Codex
- 识别同类对象
- 按优先级与时间戳生成合并计划
- 只在明确冲突策略下落地

建议第一版支持两种模式：

- **单向同步**：`--from claude --to codex` / `--from codex --to claude`
- **双向对齐**：`--bidirectional`，输出合并计划后确认再写入

## 11. CLI 设计

建议核心命令：

```bash
config-sync scan
config-sync diff --from claude --to codex
config-sync sync --from claude --to codex
config-sync sync --from codex --to claude
config-sync sync --bidirectional
config-sync doctor
```

建议参数：

```bash
--project
--global
--dry-run
--backup
--strict
--format json
--include skills,agents,mcp,rules
--exclude hooks
```

行为说明：

- `scan`：查看发现了哪些配置源
- `diff`：只展示差异，不写文件
- `sync`：执行同步
- `doctor`：检查路径、格式、兼容问题、潜在冲突

## 12. 目录结构建议

```txt
config-sync-tool/
  docs/
    superpowers/
      specs/
        2026-03-23-config-sync-tool-design.md
  src/
    core/
      model/
      normalize/
      diff/
      planner/
    adapters/
      claude/
      codex/
    parsers/
    reporters/
    cli/
  fixtures/
    claude/
    codex/
  tests/
```

说明：

- `core`：平台无关能力
- `adapters`：平台相关映射
- `parsers`：多格式读取
- `reporters`：文本、JSON、终端报表输出
- `fixtures`：真实样例脱敏后做回归测试

## 13. MVP 范围

第一版只承诺以下闭环：

### 13.1 必做

- 扫描 Claude / Codex 配置源
- 基础配置解析与映射
- 规则文件解析与迁移
- MCP 配置同步
- dry-run 预览
- backup
- 报告输出

### 13.2 可做但降级

- skills：迁移元信息 + 手工提示
- agents：迁移元信息 + 模板生成
- 输出风格：语义映射 + 告警

### 13.3 暂不做

- 远程中心配置仓
- 自动 watch 同步
- GUI 界面
- 完整运行时行为仿真

## 14. 风险评估

### 14.1 语义不等价

风险最大对象：

- skills
- agents
- output style

应对：

- 强制输出 portability 标记
- 将不完全映射项显式告警
- 为高风险对象保留手工确认

### 14.2 配置层级冲突

风险：

- 用户级配置与项目级配置冲突
- 同名对象来自多个来源

应对：

- 在统一模型中保留 `scope`
- diff 阶段显式展示冲突来源
- 默认不无脑覆盖

### 14.3 文件格式漂移

风险：

- Claude / Codex 版本变化导致字段失效或改名

应对：

- parser 与 adapter 解耦
- 映射规则表版本化
- `doctor` 检测未知字段并告警

### 14.4 误覆盖

风险：

- 自动同步覆盖用户已有自定义配置

应对：

- 默认 dry-run
- 写入前备份
- 保留 unknown 字段
- 高风险变更必须列入预览

## 15. 实施阶段建议

### Phase 1：MVP

实现：

- scanner
- parser（JSON/TOML/Markdown）
- UnifiedConfig 基础模型
- Claude / Codex 基础配置 adapter
- rules / MCP 同步
- dry-run + backup + report

### Phase 2：增强迁移

实现：

- skills portability 标记
- agents 模板生成
- 输出风格语义映射
- 项目级 / 用户级冲突策略

### Phase 3：标准配置演进

实现：

- 平台无关标准配置文件导出
- 多工具扩展
- watch / auto sync 能力

## 16. 验收标准

MVP 完成时，应满足：

1. 能扫描并识别本机 Claude / Codex 主要配置文件
2. 能将基础配置归一化为统一模型
3. 能生成 Claude ↔ Codex 的差异预览
4. 能同步基础配置、rules、MCP
5. 对 skills / agents / output style 给出明确迁移结果与告警
6. 所有写入前支持 dry-run，所有写入后有报告

## 17. 下一步

在本设计通过后，下一步进入实现规划，重点细化：

- 模块设计
- 数据结构拆分
- 映射规则表
- MVP 实施顺序
- 测试策略
