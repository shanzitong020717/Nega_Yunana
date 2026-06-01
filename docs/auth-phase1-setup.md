# 第一阶段账号系统配置说明

本阶段使用 Supabase Auth + 白名单邮箱 + `userId` 数据隔离 + RLS 权限策略。

## 环境变量

本地、Vercel Production、Vercel Preview 都需要配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
APP_BASE_URL=https://your-domain.vercel.app
```

本阶段不需要在 Vercel 配置 Supabase service role key。登录 callback 使用当前登录用户的 Supabase session，并通过 RLS 只允许用户读取自己的白名单状态、创建或更新自己的 `UserProfile`。

## Supabase Auth

1. 进入 Supabase Dashboard。
2. 打开 Authentication -> Providers。
3. 启用 Email。
4. 启用 Google，并填写 Google OAuth Client ID 和 Client Secret。
5. Site URL 填生产域名，例如 `https://nega-yunana.vercel.app`。
6. Redirect URLs 至少添加：
   - `http://localhost:3000/auth/callback`
   - `https://nega-yunana.vercel.app/auth/callback`
   - Preview 域名需要单独添加对应 `/auth/callback`。

微信快捷登录可以接入，但 Supabase 官方 Auth Provider 不直接内置微信网页登录。建议第二阶段用微信开放平台 OAuth 作为自定义登录入口，再在服务端换取或绑定 Supabase 用户身份。

## 白名单邮箱

用户登录成功后，系统会检查 `AllowedUser` 表。只有 `status = ACTIVE` 的邮箱可以进入网站。

示例 SQL：

```sql
insert into "AllowedUser" (id, email, status, role, "createdAt", "updatedAt")
values (
  gen_random_uuid()::text,
  'friend@example.com',
  'ACTIVE',
  'learner',
  now(),
  now()
);
```

## 数据隔离

业务数据继续使用现有 `UserProfile.id` 作为 `ownerId` / `userId`，同时新增 `UserProfile.authUserId` 绑定 Supabase Auth 的 UUID。API 侧每次请求都会解析当前登录用户，并把 `profileId` 传入材料、练习、记忆、表达库、复盘等 store。

## 数据库迁移

生产环境执行：

```bash
npm run db:migrate:deploy
```

迁移会创建：

- `AllowedUser`
- `UserProfile.authUserId`
- `UserProfile.email`
- `UserProfile.avatarUrl`
- 关键业务表的 RLS policy

执行后，需要在 Supabase SQL Editor 中确认 RLS 已启用，并先插入测试白名单邮箱再登录。
