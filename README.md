# 🤖 ai-commit

> AI-powered git commit message generator
> 智能Git提交信息生成器

[![npm version](https://badge.fury.io/js/ai-commit.svg)](https://badge.fury.io/js/ai-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 小学生能懂的解释

想象你在写作业，每次写完都要告诉老师：
- 写了什么内容
- 为什么这么写
- 写完没有

程序员也一样，每次改代码要告诉电脑"我改了什么"。

**ai-commit 就像一个聪明的机器人**：
- 你改完代码
- 机器人看一眼就知道你做了什么
- 自动帮你写好"提交说明"

就像机器人帮你给作文起个好题目一样！😄

---

## ✨ 功能特点

- 🔍 自动分析 `git diff` 变更内容
- 📝 生成规范的 commit message
- 🎨 支持多种风格：
  - **Conventional Commits** (`feat: add login page`)
  - **Angular** (`feat(login): add login page`)
  - **Gitmoji** (`✨ Add login page`)
- 🌐 支持中文/英文输出
- ⚡ 轻量级，无依赖大模型API

## 📦 安装

```bash
npm install -g ai-commit
```

## 🚀 使用方法

```bash
# 查看建议的 commit message
ai-commit

# 直接提交
ai-commit --commit

# 指定风格
ai-commit --style conventional
ai-commit --style angular
ai-commit --style gitmoji

# 中文输出
ai-commit --lang zh

# 完整参数
ai-commit -s conventional -l zh -c
```

## 📋 Commit 风格示例

### Conventional Commits
```
feat: 添加用户登录功能
fix: 修复登录页面样式问题
docs: 更新README文档
refactor: 重构登录逻辑
```

### Angular
```
feat(auth): add user login
fix(ui): correct login page style
docs(readme): update installation guide
```

### Gitmoji
```
✨ 添加用户登录功能
🐛 修复登录页面样式
📝 更新README文档
♻️ 重构登录逻辑
```

## ⚙️ 配置

在项目根目录创建 `.ai-commit.json`：

```json
{
  "style": "conventional",
  "lang": "zh",
  "maxLength": 72
}
```

## 🔧 开发

```bash
# 克隆仓库
git clone https://github.com/ENDcodeworld/ai-commit.git

# 安装依赖
npm install

# 构建
npm run build

# 测试
npm run dev
```

## 📄 License

MIT © ENDcodeworld
