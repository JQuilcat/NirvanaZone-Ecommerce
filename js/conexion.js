// =============================================
// ARCHIVO DE CONEXIÓN A MySQL
// =============================================
//
// - createPool() permite manejar múltiples conexiones
// - .promise() habilita el uso de async/await
// - Este archivo es utilizado por server.js
//
// =============================================

const mysql = require("mysql2");

// Usamos createPool para manejar múltiples conexiones de forma eficiente
const pool = mysql.createPool({
    host: "localhost",          // Servidor MySQL
    database: "servicios",      // Base de datos del ecommerce
    user: "root",               // Usuario de MySQL
    password: "",               // Contraseña
    waitForConnections: true,
    connectionLimit: 10,        // Máximo de conexiones simultáneas
    queueLimit: 0
});

// Exportar pool con soporte async/await
module.exports = pool.promise();