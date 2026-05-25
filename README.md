# 房贷计算器 - 伪装隐私保险箱

一个外观为正常房贷计算器的 iOS App，通过特定手势进入隐私保险箱系统。

## 功能介绍

### 表面功能：房贷计算器
- 标准计算（加减乘除）
- 房贷计算（等额本息 / 等额本金）
- 完全正常的计算器体验，iOS 风格界面

### 隐私系统（连续按 C 键 5 次进入）
- 📷 **加密相册**：存储私密照片/视频
- 📄 **加密文件**：存储私密文件
- 📝 **加密笔记**：加密文字记录
- 🌐 **隐私浏览器**：无痕浏览网页

### 紧急退出
- 摇一摇手机自动隐藏
- 按电源键/锁屏自动隐藏
- ⚡ 闪电按钮一键退出

## GitHub Actions 自动打包步骤

### 1. 上传到 GitHub
```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建新仓库后推送
git remote add origin https://github.com/你的用户名/calculator-vault.git
git push -u origin main
```

### 2. 运行 GitHub Actions
1. 打开 GitHub 仓库页面
2. 点击上方 **Actions** 标签
3. 左侧选择 **Build iOS IPA**
4. 点击右侧 **Run workflow** → **Run workflow**
5. 等待约 5-10 分钟

### 3. 下载 IPA
1. 工作流运行完成后，点击打开运行记录
2. 页面底部 **Artifacts** 区域
3. 下载 **Calculator-Vault-unsigned**
4. 解压得到 `.ipa` 文件

### 4. 签名安装（全能签/牛蛙签）
1. 安装全能签或牛蛙签 App
2. 导入 IPA 文件
3. 使用个人证书签名
4. 安装到手机

## 使用说明

1. 打开 App，显示房贷计算器界面
2. **快速连续按 C 键 5 次**
3. 首次使用设置 4-6 位密码
4. 进入隐私保险箱，使用各功能
5. 按 ⚡ 按钮或摇一摇快速退出

## 技术栈

- HTML5 / CSS3 / JavaScript
- Capacitor（混合 App 框架）
- GitHub Actions（CI/CD 自动打包）

## 本地开发

```bash
npm install
node build.js
npx cap add ios
npx cap open ios    # 用 Xcode 打开
```
