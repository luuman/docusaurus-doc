# 数据库

```mermaid
graph TD
  DB
  DB --> SqlManager{数据库管理}
  DB --> SqlTool{数据库工具}
  click SqlManager "/#/router/src" _blank
```

本项目使用 `@journeyapps/sqlcipher`
