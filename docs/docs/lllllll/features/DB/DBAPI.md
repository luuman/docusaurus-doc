# 数据库 API

```js
var sqlite3 = require("@journeyapps/sqlcipher").verbose();
// for sqlite3 version number
const pkgVersion = "5.0.2";
// const pkg = require('./package.json')
const config = require("@/config/config.js");

class Database {
  static get OPEN_READONLY() {
    return sqlite3.OPEN_READONLY;
  }

  static get OPEN_READWRITE() {
    return sqlite3.OPEN_READWRITE;
  }

  static get OPEN_CREATE() {
    return sqlite3.OPEN_CREATE;
  }

  static get SQLITE3_VERSION() {
    // return pkg.dependencies['journeyapps/sqlcipher'].substring(1)
    return pkgVersion;
  }

  static open(filename, mode) {
    let db = new Database();
    db.open(filename, mode);
    db.serialize(() => {
      db.run("PRAGMA cipher_compatibility = 3");
      // 加密 PBKDF2
      db.run(`PRAGMA key = '${dbPassword}'`);
      db.run(`PRAGMA kdf_iter = '10000'`);
      db.run("PRAGMA busy_timeout = 6000");
      db.run("PRAGMA journal_mode = WAL");
      // 使用普通同步
      db.run("PRAGMA synchronous = 1");
    });
  }

  init(dbPassword) {
    let db = new Database();
    return db.open(filename, mode);
  }

  getDBPassword(vuid) {
    if (!vuid) return;
    if (dbPwdMap[vuid]) {
      return dbPwdMap[vuid];
    } else {
      const pwBuffer = ipcRenderer.sendSync("fetchDBPassword", vuid);
      let result = Buffer.from(pwBuffer).toString("hex");
      dbPwdMap[vuid] = result;
      return dbPwdMap[vuid];
    }
  }

  getDBPath(vuid) {
    return path.join(config.configDir, `${vuid}`, `${vuid}.ackdb.enc`);
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
      let db = new sqlite3.Database(filename, mode, (err) => {
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
    if (!(statement instanceof sqlite3.Statement)) {
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
