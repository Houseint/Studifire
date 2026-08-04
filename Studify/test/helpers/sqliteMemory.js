const path = require('path');
const initSqlJs = require('sql.js/dist/sql-asm.js');

let SQLModule = null;

async function getSqlModule() {
  if (!SQLModule) {
    SQLModule = await initSqlJs();
  }
  return SQLModule;
}

function rowsFromExecResult(execResult) {
  if (!execResult || execResult.length === 0) return [];
  return execResult[0].values.map((vals) => {
    const row = {};
    execResult[0].columns.forEach((col, i) => {
      row[col] = vals[i];
    });
    return row;
  });
}

export async function createMemoryDb() {
  const SQL = await getSqlModule();
  const db = new SQL.Database();

  return {
    execAsync: async (sql) => {
      try {
        db.exec(sql);
      } catch (e) {
        throw new Error(`SQL execAsync falhou: ${e.message}`);
      }
    },
    runAsync: async (sql, params = []) => {
      db.run(sql, params);
      const lastInsertRowId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
      return { lastInsertRowId, changes: db.getRowsModified() };
    },
    getAllAsync: async (sql, params = []) => {
      return rowsFromExecResult(db.exec(sql, params));
    },
    getFirstAsync: async (sql, params = []) => {
      const rows = rowsFromExecResult(db.exec(sql, params));
      return rows.length > 0 ? rows[0] : null;
    },
    closeAsync: async () => db.close(),
  };
}

export function getExpoSqliteMock(createDb = createMemoryDb) {
  return {
    openDatabaseAsync: jest.fn(async () => createDb()),
  };
}
