// Exports all database utilities through single entry point
const { pool, initDb } = require('./pool');

module.exports = {
    pool,       // PostgreSQL connection pool
    initDb,     // Database initialization function
    // Add other DB utilities here as needed
};