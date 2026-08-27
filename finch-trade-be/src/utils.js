import db from './models/db.js';

export const queryOne = (
  query,
  params,
  callback = (result) => result,
  executor,
) => {
  return new Promise((resolve, reject) => {
    db.get(
      query,
      params,
      (err, row) => {
        if (err) reject(err);
        else resolve(callback(row, resolve));
      },
      executor,
    );
  });
};

export const queryAll = (query, params, executor) => {
  return new Promise((resolve, reject) => {
    db.all(
      query,
      params,
      (err, rows) => (err ? reject(err) : resolve(rows)),
      executor,
    );
  });
};

export const runQuery = (query, params, executor) => {
  return new Promise((resolve, reject) => {
    db.run(
      query,
      params,
      function (err) {
        if (err) return reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      },
      executor,
    );
  });
};
