# 小杨和小青的回忆网站

这是一个可以直接部署到 GitHub Pages 的静态网页。

## 上传到 GitHub 并生成在线预览链接

1. 在 GitHub 新建一个仓库，比如 `xiaoyang-xiaoqing-memory`。
2. 把这个文件夹里的所有内容上传到仓库根目录。
3. 进入仓库 `Settings` -> `Pages`。
4. `Build and deployment` 的 Source 选择 `GitHub Actions`。
5. 回到仓库的 `Actions` 页面，等待 `Deploy to GitHub Pages` 跑完。
6. 跑完后会得到在线预览网址，通常像这样：

```text
https://你的GitHub用户名.github.io/仓库名/
```

注意：直接点 GitHub 文件列表里的 `index.html` 只能看到代码；必须用 GitHub Pages 生成的网址，别人才能像正常网页一样预览。

## 访问密码

当前网页访问密码是：

```text
5201314
```

这是前端密码保护，适合普通分享场景；如果需要更严格的账号级保护，需要接入服务器或平台鉴权。

## 添加公开照片

网页里的“上传照片”功能会保存到访问者自己的浏览器本地，不会自动同步到 GitHub。

如果希望所有访问者都能看到新照片：

1. 把新照片放进 `assets/photos`。
2. 打开 `app.js`，在顶部的 `baseMemories` 数组里新增照片信息。
3. 提交到 GitHub，GitHub Pages 会重新发布。
