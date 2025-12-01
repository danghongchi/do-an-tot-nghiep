const mysql = require('mysql2/promise');

// Database config
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'webdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true // Trả về DATE/DATETIME dưới dạng string thay vì Date object để tránh timezone issues
};

// Pool instance
let pool;

const initializePool = async () => {
  pool = mysql.createPool(dbConfig);

  try {
    const connection = await pool.getConnection();
    try {
      // Ensure UTF-8 everywhere to avoid mojibake
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
      await connection.query("SET SESSION collation_connection = 'utf8mb4_unicode_ci'");
    } catch (e) {
      console.warn('Could not enforce utf8mb4 charset:', e?.message || e);
    }
    console.log('Đã kết nối thành công tới MySQL');
    connection.release();
  } catch (error) {
    console.error('Lỗi kết nối MySQL:', error);
  }
};

// Helper for MySQL queries
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Lỗi truy vấn MySQL:', error);
    throw error;
  }
};

module.exports = {
  initializePool,
  query,
  pool
};
