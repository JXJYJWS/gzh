# WeChat Article Hub

微信公众号文章分析工具 - 追踪公众号阅读量、点赞等数据。

## 功能

- 📊 **添加公众号**：输入公众号名称同步最新文章
- 📈 **数据更新**：批量获取文章的阅读、点赞、在看数据
- 🔍 **搜索筛选**：按标题/账号搜索，按阅读量/点赞量/时间排序
- 📉 **数据统计**：各账号平均阅读量对比图表
- 🧪 **Mock 模式**：开发时使用假数据，不消耗 API 额度

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 3. 配置环境变量

复制 `.env` 文件，设置你的极致了 API Key：

```
DAJIALA_KEY=your_key_here
```

如果 `DAJIALA_KEY=mock`，则使用假数据（开发测试用）。

### 4. 运行

```bash
npm run dev
```

访问 http://localhost:3000

## 使用说明

1. **添加公众号**：输入公众号名称或微信号，点击"添加并同步"
2. **更新数据**：勾选文章后点击"更新 N 篇数据"
3. **查看统计**：右侧显示各账号的平均阅读量

## API 成本

- 历史列表：0.06-0.08 元/次（每页约 5 篇）
- 互动数据：0.06 元/篇
- 建议每篇文章成本约 0.12 元

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma + SQLite
- Recharts
