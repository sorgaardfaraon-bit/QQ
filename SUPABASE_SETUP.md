# Supabase 同步设置

需要在 Supabase 项目里创建一个公开读取、允许匿名上传的照片存储桶和数据表。

## 1. SQL Editor 执行

在 Supabase Dashboard 打开 SQL Editor，执行：

```sql
create table if not exists public.memory_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text not null,
  text text not null,
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.memory_photos enable row level security;

drop policy if exists "Public read memory photos" on public.memory_photos;
create policy "Public read memory photos"
on public.memory_photos for select
to anon
using (true);

drop policy if exists "Public insert memory photos" on public.memory_photos;
create policy "Public insert memory photos"
on public.memory_photos for insert
to anon
with check (true);

drop policy if exists "Public update memory photos" on public.memory_photos;
create policy "Public update memory photos"
on public.memory_photos for update
to anon
using (true)
with check (true);
```

## 2. Storage 创建 bucket

在 Storage 创建 bucket：

```text
memory-photos
```

设置为 Public bucket。

然后在 SQL Editor 执行存储策略：

```sql
drop policy if exists "Public read memory photos bucket" on storage.objects;
create policy "Public read memory photos bucket"
on storage.objects for select
to anon
using (bucket_id = 'memory-photos');

drop policy if exists "Public upload memory photos bucket" on storage.objects;
create policy "Public upload memory photos bucket"
on storage.objects for insert
to anon
with check (bucket_id = 'memory-photos');
```

## 3. 填写项目配置

打开 `supabase-config.js`，填入 Project URL 和 anon public key：

```js
window.MEMORY_SUPABASE_CONFIG = {
  url: "https://xxxxx.supabase.co",
  anonKey: "你的 anon public key",
  bucket: "memory-photos",
  table: "memory_photos"
};
```

注意：这是静态网页，匿名上传策略意味着知道网页的人可以上传照片。网页密码可以挡住普通访问者，但不是服务器级安全。
