明白了，你想针对 `@journeyapps/sqlcipher`（Node.js/SQLite 加密库）整理一个详细的中文使用文档，包括 **创建数据库、写入操作、性能优化** 等内容。我帮你梳理如下：

---

# `@journeyapps/sqlcipher` 使用文档

`@journeyapps/sqlcipher` 是一个基于 `sqlite3` 封装的 Node.js 库，支持 **AES 加密** 的 SQLite 数据库，常用于安全存储敏感信息。

## 1. 安装

```bash
npm install @journeyapps/sqlcipher
```

或

```bash
yarn add @journeyapps/sqlcipher
```

---

## 2. 引入库

```js
const sqlite3 = require("@journeyapps/sqlcipher").verbose();
```

`verbose()` 会打印调试信息，方便排查 SQL 执行问题。

---

## 3. 创建数据库

创建或打开加密数据库：

```js
const db = new sqlite3.Database("secure.db", (err) => {
  if (err) {
    console.error("数据库打开失败", err);
  } else {
    console.log("数据库打开成功");
    // 设置加密密钥
    db.run("PRAGMA key = 'my-secret-key';");
  }
});
```

**注意：**

- `PRAGMA key` 必须在执行任何 SQL 语句之前设置。
- 如果数据库不存在，会自动创建；如果存在但密钥错误，将无法读取。

---

## 4. 创建表

```js
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});
```

- 使用 `serialize()` 保证 SQL 顺序执行。
- `IF NOT EXISTS` 避免重复创建表。

---

## 5. 插入数据

```js
const stmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");

stmt.run("Alice", "alice@example.com");
stmt.run("Bob", "bob@example.com");

stmt.finalize();
```

- `prepare()` + `run()` + `finalize()` 是推荐写法，可以重用语句，提高性能。
- 避免直接拼接字符串，防止 SQL 注入。

---

## 6. 查询数据

```js
db.all("SELECT * FROM users WHERE name = ?", ["Alice"], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(rows);
  }
});
```

- `all` 返回所有匹配结果。
- `get` 只返回第一条记录。
- `each` 可逐条处理数据，节省内存。

---

## 7. 更新与删除

```js
// 更新
db.run("UPDATE users SET email = ? WHERE name = ?", [
  "alice_new@example.com",
  "Alice",
]);

// 删除
db.run("DELETE FROM users WHERE id = ?", [1]);
```

- 所有操作都支持占位符参数 `?`，防止注入。
- 可以结合事务提高批量操作效率。

---

## 8. 使用事务

```js
db.serialize(() => {
  db.run("BEGIN TRANSACTION");

  const stmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  for (let i = 0; i < 1000; i++) {
    stmt.run(`User${i}`, `user${i}@example.com`);
  }
  stmt.finalize();

  db.run("COMMIT");
});
```

- 大批量插入时，使用事务可显著提高性能。
- 避免每条 `INSERT` 都自动提交。

---

## 9. 性能优化建议

1. **事务**
   批量操作使用 `BEGIN TRANSACTION ... COMMIT`，可提升数十倍性能。

2. **预编译语句**
   使用 `prepare()` 复用 SQL 语句，减少解析开销。

3. **索引**
   对查询频繁的字段添加索引：

   ```sql
   CREATE INDEX idx_users_email ON users(email);
   ```

4. **异步操作**
   虽然 `sqlite3` 是单线程，但通过 `serialize` 和异步 API 可以避免阻塞。

5. **PRAGMA 配置**

   - `PRAGMA journal_mode = WAL;` 提升写入并发性能。
   - `PRAGMA synchronous = NORMAL;` 权衡安全性与速度。

---

## 10. 密钥修改与加密升级

```js
// 修改数据库密钥
db.run("PRAGMA rekey = 'new-secret-key';");
```

- 可用于更换数据库密码或升级加密标准。
- `rekey` 会对整个数据库进行重加密，可能耗时较久。

---

## 11. 关闭数据库

```js
db.close((err) => {
  if (err) {
    console.error("关闭失败", err);
  } else {
    console.log("数据库已关闭");
  }
});
```

---

## 12. 小结

`@journeyapps/sqlcipher` 特性：

- 支持 AES 加密 SQLite 数据库。
- Node.js 生态兼容 `sqlite3` API。
- 支持事务、预编译语句、索引优化。
- 可更换密钥并保持数据安全。

常用操作顺序：

1. 打开数据库 + 设置密钥
2. 创建表 + 索引
3. 批量插入 + 查询
4. 事务和预编译语句优化
5. 可选加密升级

---

如果你需要，我可以帮你 **把每个操作写成独立的 Markdown 文件**，整理成一个完整 **SQLCipher 使用手册 ZIP**，便于团队直接参考。

你希望我帮你生成这个 ZIP 吗？
