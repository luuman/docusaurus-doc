# 数据库

# node-sqlite3

> `sqlite3`是一个专为`nodejs`设计的，`node`上面的轻量级嵌入式数据库，作为嵌入式数据库的代表，`sqlite`无疑是个理想的选择方案。sqlite3 几乎支持所有版本的 nodejs，同时也可以和 nwjs 集成。

### 安装

```js
npm install --save sqlite3
npm install -g node-pre-gyp
npm install -g node-gyp
```

1. `node-pre-gyp`为各个平台下载指定的预编译的二进制文件。
1. 如果无法下载到预编译的二进制文件，`sqlite3`将使用`node-gyp`和源代码来构建扩展。

> `node-pre-gyp`和`node-gyp`

1. `node-gyp`是一个跨平台的命令行工具，用于编译`C++`编写的`nodejs`扩展，首先`gyp`是为`Chromium`项目创建的项目生成工具，可以从平台无关的配置生成平台相关的`Visual Studio`、`Xcode`、`Makefile`的项目文件，`node-gyp`就是将其集成到`nodejs`中。因为`linux`的二进制分发快平台做的并不好，所有`npm`为了方便干脆就直接源码分发，用户装的时候再现场编译。
1. 有些项目二进制分发就比源码分发简单多了，所以`node-pre-gyp`来直接二进制扩展的分发。

> `node-pre-gyp`和`node-gyp`区别

1. `node-gyp`是发布扩展的源码，然后安装时候编译
1. `node-pre-gyp`是直接发布编译后的二级制形式的扩展
1. 和`sqlite3`一样的需要基于`node-gyp`安装的`npm`模块也有很多。比如`node-sass`等，都是发布源代码，然后编译安装。

# `node-sqlcipher`概况

## @journeyapps/sqlcipher

> `node-sqlite3`的`fork，修改为使用`SQLCipher。虽然`node-sqlite3`项目确实支持针对`sqlcipher`进行编译，但它需要手动工作，并且不能在`Windows`上的`Electron`上开箱即用。此分支将默认配置更改为直接捆绑`SQLCipher`，并在需要时

`Sqlcipher`数据库加密框架是一个比较流行的`Sqlite`数据库加密框架，微信的`WCDB`数据库也是使用的此框架。由于历史原因，项目使用的`Sqlcipher`框架是 3.0.x 的版本，具体哪个版本都无从查找，因为是使用的源码。最近由于业务需要，项目要加入 androidx 的支持，发现`Sqlcipher`的 3.0 版本只能支持 23 以下目标版本的编译支持，于是升级`Sqlcipher`版本至 4.0 以上。于是……问题来了，升级后发现原有的数据库无法打开，无法打开。于是开始重新梳理`Sqlcipher`数据库框架。
[Upgrading to SQLCipher 4](https://discuss.zetetic.net/t/upgrading-to-sqlcipher-4/3283)

> 兼容性

1. 二进制文件是针对 N-API 3 和 6，在 MacOS、Windows（ia32 和 x64）和 Linux（x64）上构建的
1. 支持 Node 10+ 和 Electron 6+
1. 其他平台/架构可以通过从源代码构建来工作 - 请参阅下面的部分

> Usage with electron-forge / electron-rebuild

1. 如果使用 Electron 11+，请使用支持 N-API 6+ (v10.20.0+ / v12.17.0+ / v14.0.0) 的节点版本。
1. 在 npm install/之后 yarn install，确保该文件夹 node_modules/@journeyapps/sqlcipher/lib/binding/napi-v6-linux-x64 存在。如果没有，请再次检查上一步，删除 node_modules 文件夹，然后重试。
1. 使用这个库的禁止重建 onlyModules 的选项 electron-rebuild 在 package.json：

```js
'config': {
	'forge': {
		'electronRebuildConfig': {
			'onlyModules': []  // Specify other native modules here if required
		}
	}
}
```

### 安装

```js
npm install --save '@journeyapps/sqlcipher'
```

### 使用

```js
var sqlite3 = require('@journeyapps/sqlcipher').verbose()
var db = new sqlite3.Database('test.db')
db.serialize(function() {
  // 这是默认值，但最好明确指定：
  db.run('PRAGMA cipher_compatibility = 4')
  // 要打开使用SQLCipher 3.x创建的数据库，请使用以下命令：
  // db.run('PRAGMA cipher_compatibility = 3')
	// 设置数据库密钥
  db.run('PRAGMA key = 'mysecret'')
  db.run('CREATE TABLE lorem (info TEXT)')
  var stmt = db.prepare('INSERT INTO lorem VALUES (?)')
  for (var i = 0 i < 10 i++) {
    stmt.run('Ipsum ' + i)
  }
  stmt.finalize()
  db.each('SELECT rowid AS id, info FROM lorem', function(err, row) {
    console.log(row.id + ': ' + row.info)
  })
})
db.close()
```

```js
// 引入模块
let sqlite3 = require("@journeyapps/sqlcipher").verbose();
// 创建数据库
dbINS = new sqlite3.Database(dbPath);
return new Promise((resolve, reject) => {
  dbINS.serialize(() => {
    dbINS.run("PRAGMA cipher_compatibility = 3");
    dbINS.run(`PRAGMA key = '${dbPassword}'`);
    dbINS.run(`PRAGMA kdf_iter = '10000'`);
    dbINS.run("PRAGMA busy_timeout = 6000");
    dbINS.run("PRAGMA journal_mode = WAL");
    dbINS.run("PRAGMA synchronous = 1", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(dbINS);
      }
    });
  });
});
```

# API

## verbose

将执行模式设置为详细以生成长堆栈跟踪。

## Database 打开创建数据库

`new sqlite3.Database(filename, [mode], [callback])`

1. `filename`有效的文件名: 匿名内存数据库，对于匿名基于磁盘的数据库，则为空字符串。匿名数据库不会持久化，关闭数据库内容将丢失。
1. `mode (optional)`数据库模式: `OPEN_READONLY`只读、`OPEN_READWRITE`只读写、`OPEN_CREATE`可创建。默认值为 OPEN_READWRITE |OPEN_CREATE。
1. `callback (optional)`回调函数: `error`错误对象，打开成功发出不带参数的 open
1. 返回`Database`对象

```js
const sqlite3 = require("@journeyapps/sqlcipher").verbose();
const DBs = new sqlite3.Database(filename, (err) => {
  if (err) throw err;
});
```

> 临时数据库

```js
// 内存型，数据不会永久保存
const DBs = new sqlite3.Database(":memory:", (err) => {
  if (err) throw err;
});
```

### close 关闭数据库

`Database#close([callback])`

```js
DBs.close();
DBs.close((err) => {
  if (err) throw err;
});
```

### configure 配置选项

`Database#configure(option, value)`

```js
DBs.configure((err) => {});
```

### run 执行 SQL 查询

`Database#run(sql, [param, ...], [callback])`

```js
DBs.run(sql, [param, ...], (err) => {})
// Directly in the function arguments.
db.run("UPDATE tbl SET name = ? WHERE id = ?", "bar", 2)
// As an array.
db.run("UPDATE tbl SET name = ? WHERE id = ?", [ "bar", 2 ])
// As an object with named parameters.
db.run("UPDATE tbl SET name = $name WHERE id = $id", {
  $id: 2,
  $name: "bar"
})
```

### get 执行 SQL 查询使用第一个结果行调用回调

`Database#get(sql, [param, ...], [callback])`

```js
DBs.get(sql, [param, ...], (error, row) => {})
```

### all 执行 SQL 查询使用所有结果行调用回调

`Database#all(sql, [param, ...], [callback])`

```js
DBs.all(sql, [param, ...], (error, row) => {})
```

### each 执行 SQL 查询每个结果行调用一次回调

`Database#each(sql, [param, ...], [callback], [complete])`

```js
DBs.each(sql, [param, ...], (error, row) => {})
```

### exec

`Database#exec(sql, [callback])`

```js

```

### prepare 预编译 SQL

`Database#prepare(sql, [param, ...], [callback])`

```js

```

## Statement

### bind

`Statement#bind([param, ...], [callback])`

```js

```

### reset

`Statement#reset([callback])`

```js

```

### finalize

`Statement#finalize([callback])`

```js

```

### run

`Statement#run([param, ...], [callback])`

```js

```

### get

`Statement#get([param, ...], [callback])`

```js

```

### all

`Statement#all([param, ...], [callback])`

```js

```

### each

`Statement#each([param, ...], [callback], [complete])`

```js

```

## Control Flow

### serialize 序列化执行

`Database#serialize([callback])`

```js
// 这里执行的命令是并行的
db.serialize(function() {
  // 这里执行的命令是串行的
  db.serialize(function() {
    // 这里执行的命令是串行的
  })
  // 这里执行的命令是串行的
})
// 这里执行的命令是并行的

db.serialize(function() {
  // 这是默认值，但最好明确指定：
  db.run('PRAGMA cipher_compatibility = 4')
  // 要打开使用SQLCipher 3.x创建的数据库，请使用以下命令：
  // db.run('PRAGMA cipher_compatibility = 3')
	// 设置数据库密钥
  db.run('PRAGMA key = 'mysecret'')
  db.run('CREATE TABLE lorem (info TEXT)')
  var stmt = db.prepare('INSERT INTO lorem VALUES (?)')
  for (var i = 0 i < 10 i++) {
    stmt.run('Ipsum ' + i)
  }
  stmt.finalize()
  db.each('SELECT rowid AS id, info FROM lorem', function(err, row) {
    console.log(row.id + ': ' + row.info)
  })
})
```

### parallelize 并行执行模式

`Database#parallelize([callback])`

```js
db.serialize(function () {
  // 这里执行的命令是串行的
  db.parallelize(function () {
    // 这里执行的命令是并行的
  });
  // 这里执行的命令是串行的
});
```

## Debugging

### on

`Database#on('trace', [callback])`

```js

```

The trace event is emitted whenever a query is run. The first and only parameter to the callback is the SQL string that was sent to the database. The event is emitted as soon as the query is executed (e.g. with .run() or .get()). A single statement may be emitted more once. EXPLAIN statements will not trigger an event, so it's safe to pipe all SQL queries you receive from this event back into the database prefixed with a EXPLAIN QUERY PLAN.

If you execute statements from this callback, make sure that you don't enter an infinite loop!

### on

`Database#on('profile', [callback])`

```js

```

## Extensions

### loadExtension

`Database#loadExtension(path, [callback])`

```js

```

# 封装

## aa-sqlite 模块

```js
const sqlite3 = require("sqlite3").verbose();
var db;

exports.db = db;

exports.open = function (path) {
  return new Promise(function (resolve) {
    this.db = new sqlite3.Database(path, function (err) {
      if (err) reject("Open error: " + err.message);
      else resolve(path + " opened");
    });
  });
};

// any query: insert/delete/update
exports.run = function (query) {
  return new Promise(function (resolve, reject) {
    this.db.run(query, function (err) {
      if (err) reject(err.message);
      else resolve(true);
    });
  });
};

// first row read
exports.get = function (query, params) {
  return new Promise(function (resolve, reject) {
    this.db.get(query, params, function (err, row) {
      if (err) reject("Read error: " + err.message);
      else {
        resolve(row);
      }
    });
  });
};

// set of rows read
exports.all = function (query, params) {
  return new Promise(function (resolve, reject) {
    if (params == undefined) params = [];

    this.db.all(query, params, function (err, rows) {
      if (err) reject("Read error: " + err.message);
      else {
        resolve(rows);
      }
    });
  });
};

// each row returned one by one
exports.each = function (query, params, action) {
  return new Promise(function (resolve, reject) {
    var db = this.db;
    db.serialize(function () {
      db.each(query, params, function (err, row) {
        if (err) reject("Read error: " + err.message);
        else {
          if (row) {
            action(row);
          }
        }
      });
      db.get("", function (err, row) {
        resolve(true);
      });
    });
  });
};

exports.close = function () {
  return new Promise(function (resolve, reject) {
    this.db.close();
    resolve(true);
  });
};
```

```js
const fs = require("fs");
const sqlite = require("aa-sqlite");

async function mainApp() {
  console.log(await sqlite.open("./users.db"));

  // Adds a table

  var r = await sqlite.run(
    "CREATE TABLE users(ID integer NOT NULL PRIMARY KEY, name text, city text)"
  );
  if (r) console.log("Table created");

  // Fills the table

  let users = {
    Naomi: "chicago",
    Julia: "Frisco",
    Amy: "New York",
    Scarlett: "Austin",
    Amy: "Seattle"
  };

  var id = 1;
  for (var x in users) {
    var entry = `'${id}','${x}','${users[x]}'`;
    var sql = "INSERT INTO users(ID, name, city) VALUES (" + entry + ")";
    r = await sqlite.run(sql);
    if (r) console.log("Inserted.");
    id++;
  }

  // Starting a new cycle to access the data

  await sqlite.close();
  await sqlite.open("./users.db");

  console.log("Select one user:");

  var sql = "SELECT ID, name, city FROM users WHERE name='Naomi'";
  r = await sqlite.get(sql);
  console.log("Read:", r.ID, r.name, r.city);

  console.log("Get all users:");

  sql = "SELECT * FROM users";
  r = await sqlite.all(sql, []);
  r.forEach(function (row) {
    console.log("Read:", row.ID, row.name, row.city);
  });

  console.log("Get some users:");

  sql = "SELECT * FROM users WHERE name=?";
  r = await sqlite.all(sql, ["Amy"]);
  r.forEach(function (row) {
    console.log("Read:", row.ID, row.name, row.city);
  });

  console.log("One by one:");

  sql = "SELECT * FROM users";
  r = await sqlite.each(sql, [], function (row) {
    console.log("Read:", row.ID, row.name, row.city);
  });

  if (r) console.log("Done.");

  sqlite.close();
}

try {
  fs.unlinkSync("./users.db");
} catch (e) {}

mainApp();
```

## class

```js
const sqlite = require("sqlite3");
// for sqlite3 version number
const pkgVersion = "5.0.2";

class Database {
  static get OPEN_READONLY() {
    return sqlite.OPEN_READONLY;
  }

  static get OPEN_READWRITE() {
    return sqlite.OPEN_READWRITE;
  }

  static get OPEN_CREATE() {
    return sqlite.OPEN_CREATE;
  }

  static get SQLITE3_VERSION() {
    // return pkg.dependencies.sqlite3.substring(1)
    return pkgVersion;
  }

  static open(filename, mode) {
    let db = new Database();
    return db.open(filename, mode);
  }

  // 创建、打开数据库
  open(filename, mode) {
    if (typeof mode === "undefined") {
      mode = Database.OPEN_READWRITE | Database.OPEN_CREATE;
    } else if (typeof mode !== "number") {
      throw new TypeError("Database.open: mode is not a number");
    }
    return new Promise((resolve, reject) => {
      if (this.db)
        return reject(new Error("Database.open: database is already open"));
      let db = new sqlite.Database(filename, mode, (err) => {
        if (err) {
          reject(err);
        } else {
          this.db = db;
          this.filename = filename;
          resolve(this);
        }
      });
    });
  }

  // 关闭数据库
  close(fn) {
    if (!this.db) {
      return Promise.reject(new Error("Database.close: database is not open"));
    }
    if (fn) {
      return fn(this)
        .then((result) => {
          return this.close().then((_) => {
            return result;
          });
        })
        .catch((err) => {
          return this.close().then((_) => {
            return Promise.reject(err);
          });
        });
    }
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          resolve(this);
        }
      });
    });
  }

  run(...args) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error("Database.run: database is not open"));
      }
      // Need a real function because 'this' is used.
      let callback = function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      };
      args.push(callback);
      this.db.run.apply(this.db, args);
    });
  }

  get(...args) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error("Database.get: database is not open"));
      }
      let callback = (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      };
      args.push(callback);
      this.db.get.apply(this.db, args);
    });
  }

  all(...args) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error("Database.all: database is not open"));
      }
      let callback = (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      };
      args.push(callback);
      this.db.all.apply(this.db, args);
    });
  }

  each(...args) {
    if (args.length === 0 || typeof args[args.length - 1] !== "function") {
      throw TypeError("Database.each: last arg is not a function");
    }
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error("Database.each: database is not open"));
      }
      let callback = (err, nrows) => {
        if (err) {
          reject(err);
        } else {
          resolve(nrows);
        }
      };
      args.push(callback);
      this.db.each.apply(this.db, args);
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error("Database.exec: database is not open"));
      }
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  transaction(fn) {
    return this.exec("BEGIN TRANSACTION").then((_) => {
      return fn(this)
        .then((result) => {
          return this.exec("END TRANSACTION").then((_) => {
            return result;
          });
        })
        .catch((err) => {
          return this.exec("ROLLBACK TRANSACTION").then((_) => {
            return Promise.reject(err);
          });
        });
    });
  }

  prepare(...args) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error("Database.prepare: database is not open"));
      }
      let statement;
      let callback = (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Statement(statement));
        }
      };
      args.push(callback);
      statement = this.db.prepare.apply(this.db, args);
    });
  }
}

//-----------------------------------------------------------------------------
// The Statement class
//-----------------------------------------------------------------------------

class Statement {
  constructor(statement) {
    if (!(statement instanceof sqlite.Statement)) {
      throw new TypeError(`Statement: 'statement' is not a statement instance`);
    }
    this.statement = statement;
  }

  bind(...args) {
    return new Promise((resolve, reject) => {
      let callback = (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      };
      args.push(callback);
      this.statement.bind.apply(this.statement, args);
    });
  }

  reset() {
    return new Promise((resolve, reject) => {
      this.statement.reset((_) => {
        resolve(this);
      });
    });
  }

  finalize() {
    return new Promise((resolve, reject) => {
      this.statement.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(); // can't use it anymore
        }
      });
    });
  }

  run(...args) {
    return new Promise((resolve, reject) => {
      // Need a real function because 'this' is used.
      let callback = function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      };
      args.push(callback);
      this.statement.run.apply(this.statement, args);
    });
  }

  get(...args) {
    return new Promise((resolve, reject) => {
      let callback = (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      };
      args.push(callback);
      this.statement.get.apply(this.statement, args);
    });
  }

  all(...args) {
    return new Promise((resolve, reject) => {
      let callback = (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      };
      args.push(callback);
      this.statement.all.apply(this.statement, args);
    });
  }

  each(...args) {
    if (args.length === 0 || typeof args[args.length - 1] !== "function") {
      throw TypeError("Statement.each: last arg is not a function");
    }
    return new Promise((resolve, reject) => {
      let callback = (err, nrows) => {
        if (err) {
          reject(err);
        } else {
          resolve(nrows);
        }
      };
      args.push(callback);
      this.statement.each.apply(this.statement, args);
    });
  }
}

module.exports = Database;
```

```js
const assert = require("assert");
const fs = require("fs");
const Database = require("../sqlite-async");

let db;
let statement;

describe("Module", function () {
  describe("Database", function () {
    describe("SQLITE3_VERSION", function () {
      it("should log the version number", function () {
        return console.log(
          "        sqlite3 version: " + Database.SQLITE3_VERSION
        );
      });
    });
    describe("open", function () {
      it("should open the database", function () {
        return Database.open("test.db").then((_db) => {
          db = _db;
        });
      });
    });
    describe("exec", function () {
      it("should create a table", function () {
        return db.exec(
          `CREATE TABLE test (
                         id INT PRIMARY KEY,
                         name TEXT NOT NULL
                     )`
        );
      });
    });
    describe("run (insert)", function () {
      it("should insert a row", function () {
        return db.run('INSERT INTO test VALUES (1, "inserted")');
      });
    });
    describe("run (update)", function () {
      it("should update a value", function () {
        return db
          .run('UPDATE test SET name = "test" WHERE id = 1')
          .then((result) => {
            assert.strictEqual(
              result.changes,
              1,
              "Expected one change in the database"
            );
          });
      });
    });
    describe("run (delete)", function () {
      it("should delete a row", function () {
        return db.run('INSERT INTO test VALUES (2, "test")').then((_) => {
          return db.run("DELETE FROM test WHERE id = 2").then((result) => {
            assert.strictEqual(
              result.changes,
              1,
              "Expected one change in the database"
            );
          });
        });
      });
    });
    describe("get", function () {
      it("should select one row", function () {
        return db.get("SELECT * FROM test").then((row) => {
          assert.deepStrictEqual(row, {
            id: 1,
            name: "test"
          });
        });
      });
    });
    describe("all", function () {
      it("should select all rows", function () {
        return db.all("SELECT * FROM test").then((rows) => {
          assert.deepStrictEqual(rows, [
            {
              id: 1,
              name: "test"
            }
          ]);
        });
      });
    });
    describe("each", function () {
      it("should select rows and pass each to a callback", function () {
        return db.each("SELECT * FROM  test WHERE id = 1", (err, row) => {
          assert.deepStrictEqual(row, {
            id: 1,
            name: "test"
          });
        });
      });
    });

    describe("transaction (success)", function () {
      it("should execute and rollback a failed transaction", function () {
        return db
          .transaction((db) => {
            return Promise.all([
              db.run('INSERT INTO test VALUES (2, "two")'),
              db.run("INSERT INTO test VALUES (3, NULL)")
            ]);
          })
          .then(
            (_) => {
              throw new Error("The transaction should not have succeeded.");
            },
            (err) => {
              assert.strictEqual(err.code, "SQLITE_CONSTRAINT");
            }
          );
      });
      it("should leave the database unchanged", function () {
        return db.all("SELECT * FROM test").then((rows) => {
          assert.strictEqual(
            rows.length,
            1,
            "Expected only one row in the database."
          );
        });
      });
    });
    describe("transaction (success)", function () {
      it("should execute and commit a successful transaction", function () {
        return db.transaction((db) => {
          return Promise.all([
            db.run('INSERT INTO test VALUES (2, "two")'),
            db.run('INSERT INTO test VALUES (3, "three")')
          ]);
        });
      });
      it("should have added two rows to the database", function () {
        return db.all("SELECT * FROM test").then((rows) => {
          assert.strictEqual(
            rows.length,
            3,
            "Expected three rows in the database."
          );
        });
      });
    });
    describe("prepare", function () {
      it("should prepare a statement", function () {
        return db
          .prepare("SELECT * FROM test WHERE id = ?")
          .then((_statement) => {
            statement = _statement;
          });
      });
    });
  });

  describe("Statement", function () {
    describe("bind", function () {
      it("should bind a value to the statement", function () {
        return statement.bind(1);
      });
    });
    describe("get", function () {
      it("should select one row", function () {
        return statement.get().then((row) => {
          assert.deepStrictEqual(row, {
            id: 1,
            name: "test"
          });
        });
      });
    });
    describe("all", function () {
      it("should select all rows", function () {
        return statement.all().then((rows) => {
          assert.deepStrictEqual(rows, [
            {
              id: 1,
              name: "test"
            }
          ]);
        });
      });
    });
    describe("each", function () {
      it("should select rows and pass each to a callback", function () {
        return statement.each((err, row) => {
          assert.deepStrictEqual(row, {
            id: 1,
            name: "test"
          });
        });
      });
    });
    describe("run", function () {
      it("should delete all rows from the database", function () {
        return db.prepare("DELETE FROM test").then((statement) => {
          return statement.run().then((result) => {
            assert.strictEqual(
              result.changes,
              3,
              "Expected three changes in the database"
            );
            return statement.finalize();
          });
        });
      });
    });
    describe("finalize", function () {
      it("should finalize the statement", function () {
        return statement.finalize();
      });
    });
  });

  describe("Database", function () {
    describe("close", function () {
      it("should close database", function () {
        return db.close();
      });
    });
    describe("open", function () {
      it("should open the database again", function () {
        return Database.open("test.db").then((_db) => {
          db = _db;
        });
      });
    });
    describe("close", function () {
      it("should close database after executing the promise", function () {
        return db
          .close((arg) => {
            assert(arg === db);
            return Promise.resolve("success");
          })
          .then((result) => {
            assert.strictEqual(result, "success");
          });
      });
      it("should no longer be able to use the database", function () {
        assert(db.db === null);
      });
    });
  });

  after(function (done) {
    fs.unlink("test.db", done);
  });
});
```

```js
Database.open("test.db").then((_db) => {
  db = _db;
});

db.exec(`CREATE TABLE test ( id INT PRIMARY KEY, name TEXT NOT NULL )`);

db.run('INSERT INTO test VALUES (1, "inserted")');

db.run('UPDATE test SET name = "test" WHERE id = 1').then((result) => {
  assert.strictEqual(result.changes, 1, "Expected one change in the database");
});

return db.run('INSERT INTO test VALUES (2, "test")').then((_) => {
  return db.run("DELETE FROM test WHERE id = 2").then((result) => {
    assert.strictEqual(
      result.changes,
      1,
      "Expected one change in the database"
    );
  });
});
```

```js

```
