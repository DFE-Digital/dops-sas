const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


/**
 * Fetches roles for a userID
 * @param {number} userId The unique identifier of the user.
 * @returns {Promise<Array>} An array of the user's roles, or an empty array if no roles are found.
 */
async function getRolesByUserID(userId) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."UserRole"
            WHERE "UserID" = $1
        `, [userId]);

        // Return all rows (roles) instead of a single role
        return result.rows;
    } catch (error) {
        console.error('Error in getRolesByUserID:', error);
        return []; // Return an empty array in case of error
    }
}

module.exports = {
    getRolesByUserID
};