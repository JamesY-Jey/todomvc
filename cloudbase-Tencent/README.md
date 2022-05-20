# Cloudbase-Tencent

> 腾讯云开发的演示项目，基于Vue3的 **Todo Demo**

[查看演示](https://s.jamesy.cn/todo/cloudbase-tencent/)

云开发主要文件：

```
| - cloudfunctions/ # 存放云函数代码
| - api/ # 接口代码(接口形式调用云函数)
| - utils/ # 云开发相关代码封装
| - cloudbaserc.json # 部署至腾讯云开发云函数的配置文件
```

## 云开发

使用了腾讯云开发，目录为 `./cloudfunctions/`

- 可使用VSCode插件 [Tencent CloudBase Toolkit](https://marketplace.visualstudio.com/items?itemName=tencentcloud.cloudbase-toolkit) 管理云开发，包括上传云函数、部署云函数等，需要授权登录云开发环境
- `cloudbaserc.json` 相关配置请查看[云开发配置](https://docs.cloudbase.net/cli-v1/config)
- 默认使用匿名登录，其他登录方式请查看[登录鉴权](https://docs.cloudbase.net/authentication/auth/introduce)
- [CLI 文档](https://docs.cloudbase.net/cli-v1/intro.html)
- 服务端SDK [文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction.html)
- [帮助文档](https://cloud.tencent.com/document/product/876/46798)
- [Vite 自定义配置](https://cn.vitejs.dev/config/)

## 推荐IDE设置

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur)

## 运行

确保已经安装了 `Vite`，Vite 需要 Node.js 版本 `>= 12.0.0`，请查看 [Vite 安装](https://cn.vitejs.dev/install)
默认为`3001`端口，已在云开发环境中配置安全域名

```sh
# Project Setup
npm install

# Compile and Hot-Reload for Development
npm run dev

# Compile and Minify for Production
npm run build

# assign the path
npx vite build --base=yourPath/
```
