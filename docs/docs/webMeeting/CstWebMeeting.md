# 会议

## cst-web-meeting

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

| 部门       |                      |                           |                  |
| ---------- | -------------------- | ------------------------- | ---------------- |
| Martx      | [matrx_windows][1]   | [windows-cst-sdk][2]      |                  |
| Official   | [module-common][3]   | [meeting-control][4]      | [proxy_local][5] |
| WebMeeting | [cst-web-meeting][6] | [cst-web-meeting-demo][7] |                  |
|            |                      |                           |                  |

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
