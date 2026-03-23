# config-sync-tool

本地 TypeScript CLI，用于在 Claude 和 Codex 之间扫描配置、预览差异，并按宽松模式执行双向同步。

## 当前能力

- 扫描 Claude / Codex 配置来源
- 读取并归一化两边配置到统一模型
- 预览 `claude -> codex` 或 `codex -> claude` 的差异
- 按宽松模式生成同步结果
- 写入前自动为已存在目标文件创建 `.bak` 备份
- 基础诊断命令，检查配置是否缺失

当前 MVP 主要覆盖的配置源：

- Claude 用户配置：`~/.claude/settings.json`
- Claude 项目规则：`<project>/.claude/CLAUDE.md`
- Codex 用户配置：`~/.codex/config.toml`

## 适用场景

- 从 Claude 切到 Codex 时，尽量复用已有配置
- 从 Codex 切回 Claude 时，减少手工迁移
- 在真正写入前，先看同步差异
- 对不兼容字段采用“尽量转换、否则告警/跳过”的宽松策略

## 环境要求

- Node.js 18+
- npm

## 本地使用

### 1. 安装依赖

```bash
npm install
```

### 2. 构建

```bash
npm run build
```

### 3. 运行 CLI

```bash
node dist/src/cli/index.js --help
```

也可以直接走开发模式：

```bash
npm run dev -- --help
```

## 命令说明

所有命令都需要显式传入：

- `--home-dir <path>`：用户主目录
- `--project-dir <path>`：项目目录

### scan

扫描当前可发现的 Claude / Codex 配置源。

```bash
node dist/src/cli/index.js scan \
  --home-dir "$HOME" \
  --project-dir "$PWD"
```

### doctor

检查 Claude / Codex 配置是否存在。

```bash
node dist/src/cli/index.js doctor \
  --home-dir "$HOME" \
  --project-dir "$PWD"
```

### diff

预览两个工具之间的配置差异，不写入文件。

```bash
node dist/src/cli/index.js diff \
  --from claude \
  --to codex \
  --home-dir "$HOME" \
  --project-dir "$PWD"
```

```bash
node dist/src/cli/index.js diff \
  --from codex \
  --to claude \
  --home-dir "$HOME" \
  --project-dir "$PWD"
```

### sync

默认是 dry-run。只有加 `--write` 才会实际写入目标文件。

```bash
node dist/src/cli/index.js sync \
  --from claude \
  --to codex \
  --home-dir "$HOME" \
  --project-dir "$PWD"
```

实际写入：

```bash
node dist/src/cli/index.js sync \
  --from codex \
  --to claude \
  --write \
  --home-dir "$HOME" \
  --project-dir "$PWD"
```

## 写入行为

- `sync` 不带 `--write` 时，只做预览
- 带 `--write` 时，工具会把源配置映射到目标格式并写入
- 如果目标文件已存在，会先创建同路径 `.bak` 备份
- 如果目标文件不存在，会自动创建目录并写入新文件

## 参数约束

- `--from` / `--to` 仅支持：`claude`、`codex`
- `--from` 和 `--to` 不能相同

## 项目结构

```text
src/
  adapters/     # Claude / Codex 双向映射
  cli/          # CLI 入口与命令
  core/         # 统一模型、diff、planner、apply
  parsers/      # 文件发现与结构化读取
fixtures/       # 本地示例配置
```

## 说明

这是一个本地优先的同步工具，不依赖远程服务。

当前仓库公开版本聚焦 MVP 主链路：扫描、预览、同步、备份与基础诊断。
后续可以继续补充更多配置项、输出格式和兼容策略。
