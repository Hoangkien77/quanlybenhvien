const { Pool } = require('pg');

// Tạo một pool kết nối đến PostgreSQL
const pool = new Pool({
    user: 'postgres',         // Tên người dùng PostgreSQL
    host: '127.0.0.1',            // Địa chỉ máy chủ PostgreSQL
    database: 'quanlybenhvien', // Tên cơ sở dữ liệu
    password: 'thaydoi1',     // Mật khẩu của bạn
    port: 5432,                   // Cổng mặc định của PostgreSQL
});

module.exports = pool;