const mysql = require("mysql2/promise");
require("dotenv").config();

// Create MySQL connection pool
const mysqlPool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Convert PostgreSQL-style query to MySQL
function convertQuery(sql) {
  let converted = sql;

  // Convert $1, $2, $3... to ?
  converted = converted.replace(/\$(\d+)/g, '?');

  // Convert PostgreSQL INTERVAL syntax to MySQL
  // INTERVAL '1 day' → INTERVAL 1 DAY
  converted = converted.replace(/INTERVAL\s+'(\d+)\s+(\w+)'/gi, 'INTERVAL $1 $2');

  // Convert CURRENT_DATE to CURDATE() for MySQL
  converted = converted.replace(/\bCURRENT_DATE\b/gi, 'CURDATE()');

  // Convert DATE(column) for MySQL compatibility (already works)

  return converted;
}

// Wrapper to make MySQL work like PostgreSQL's pool.query()
const pool = {
  query: async (sql, params = []) => {
    try {
      const convertedSql = convertQuery(sql);

      // Check if it's a RETURNING query (PostgreSQL specific)
      const hasReturning = /RETURNING\s+(\w+)/i.test(convertedSql);
      let sqlToExecute = convertedSql;

      if (hasReturning) {
        // Remove RETURNING clause for MySQL
        sqlToExecute = convertedSql.replace(/\s*RETURNING\s+\w+/gi, '');
      }

      const [result] = await mysqlPool.execute(sqlToExecute, params);

      // Handle different result types
      if (Array.isArray(result)) {
        // SELECT query - result is array of rows
        return {
          rows: result,
          rowCount: result.length
        };
      } else {
        // INSERT/UPDATE/DELETE query
        const response = {
          rows: [],
          rowCount: result.affectedRows
        };

        // For INSERT with RETURNING, return the insertId
        if (hasReturning && result.insertId) {
          response.rows = [{ id: result.insertId }];
        }

        return response;
      }
    } catch (error) {
      console.error('MySQL Query Error:', error.message);
      console.error('Original SQL:', sql);
      throw error;
    }
  }
};

const testConnection = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    console.log("✅ MySQL connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

module.exports = { pool, testConnection };
