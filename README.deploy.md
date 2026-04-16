# 部署到 Vercel

## 方式一：使用 Vercel Postgres (推荐，数据持久化)

### 1. 修改 Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. 在 Vercel 项目中添加环境变量

```
DATABASE_URL = postgresql://...
DAJIALA_KEY = your_key
```

### 3. 部署

```bash
vercel
```

## 方式二：使用 SQLite (数据会重置，仅用于测试)

直接部署即可，但注意：
- 每次 Vercel 重新部署，数据会清空
- 适合演示测试，不适合生产使用

## 环境变量配置

在 Vercel 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| DAJIALA_KEY | 你的API Key | 必填 |
| DAJIALA_VERIFYCODE | 附加码(可选) | 可不填 |
