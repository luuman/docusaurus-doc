## 项目介绍

| 部门       |                       |                           |                  |
| ---------- | --------------------- | ------------------------- | ---------------- |
| Martx      | [TauriDoc_windows][1] | [windows-cst-sdk][2]      |                  |
| Official   | [module-common][3]    | [meeting-control][4]      | [proxy_local][5] |
| WebMeeting | [cst-web-meeting][6]  | [cst-web-meeting-demo][7] |                  |
|            |                       |                           |                  |

### TauriDoc_windows

### windows-cst-sdk

[[Git子模块]]

### module-common

公共组件，submodule 子模块管理

[[Git子模块]]

### meeting-control

```js
// 开发模式 localhost:3000
npm run dev
// 代理后 http://localhost:8090/meeting-control
```

### proxy_local

```js
// 开启代理 （默认代理 work 环境）
node index.js
// 打开 http://localhost:8090 访问代理页面
```

### cst-web-meeting

```js
// 开发模式 localhost:
npm run start

-- /src
	-- /assets          img,icon,css 等
	-- /service         业务逻辑代码
	-- /slice           全局状态存储与修改
	-- /library         依赖的其他资源
	-- /routes          路由
	-- /components      组件
		-- /base            基础组件
		-- /meeting         会议组件
		-- /room            房间组件
	-- /pages           页面
	-- /hooks           react hook
	-- /encryption      加解密
	-- /http            http请求
	-- /utils           通用工具类
	-- /constant        常量
	-- /config          配置项
	-- /window-mount    挂载到window上的方法
```

```js
// 打包
npm run build

// proto 编译js
npm run proto

// proto 编译ts
npm run protots
```

### cst-web-meeting-demo

## 环境搭建

### VPN

| VPN  |                |               |               |
| ---- | -------------- | ------------- | ------------- |
| 国内 | 39.97.100.145  | 119.8.126.122 | 59.110.27.225 |
| 国外 | 188.116.29.146 |               |               |

| 工具     |     |        |          |
| -------- | --- | ------ | -------- |
| Git      |     | node   | v16.15.0 |
| node-gyp |     | node   | v14.20.0 |
|          |     | python | v3.1     |

| 工具               |              |                        |            |
| ------------------ | ------------ | ---------------------- | ---------- |
| NetLimiter 4 (x64) | 网络限制器   | DB Browser (SQLCipher) | 数据库     |
| Visual Studio 2017 |              | LookHandles            | 进程分析器 |
| decrypt            | 日志解密工具 |                        |            |

# 相关网站

| 协作              | 审核                    | 编译         | 发布           |
| ----------------- | ----------------------- | ------------ | -------------- |
| [禅道][9]         | [代码扫描器][13]        | [编译器][11] | [下包地址][12] |
| [Gitlab 仓库][8]  | [Ldap 个人账户平台][10] |              |                |
| [日志后台][17]    |                         |              |                |
| [wiki][14]        |                         |              |                |
| [docker 仓库][15] |                         |              |                |
| [maven 仓库][16]  |                         |              |                |

[1]: https://gitlab.corp.TauriDoc.team/frontend/TauriDoc_windows "TauriDoc"
[2]: https://gitlab.corp.TauriDoc.team/frontend/windows-cst-sdk "CST SDK"
[3]: https://gitlab.corp.TauriDoc.team/web/module-common "公共组件"
[4]: https://gitlab.corp.TauriDoc.team/web/meeting-control "会议管理"
[5]: https://gitlab.corp.TauriDoc.team/web/proxy_local "代理"
[6]: https://gitlab.corp.TauriDoc.team/crystal/cst-web-meeting "Web会议"
[7]: https://gitlab.corp.TauriDoc.team/crystal/cst-web-meeting-demo "Web会议Demo"
[8]: https://gitlab.corp.TauriDoc.team/
[9]: https://chandao.corp.TauriDoc.team/
[10]: https://ipa1.corp.TauriDoc.team/
[11]: https://jenkins-apk.corp.TauriDoc.team/
[12]: https://TauriDoc-app.corp.TauriDoc.team/
[13]: https://sonar.corp.TauriDoc.team/ "SonarQube扫描器"
[14]: https://TauriDoc.atlassian.net/
[15]: https://repo.corp.TauriDoc.team/
[16]: https://repo.corp.TauriDoc.team/
[17]: https://fed.corp.TauriDoc.team/TauriDoc-log/view?type=windows&env=test&isVip=false&time=1652350843240&pageIndex=1&pageSize=50&startDate=&endDate=&enterpriseId=&uid=
