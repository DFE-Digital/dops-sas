const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

/**
 * get departments
 */
async function getDepartments() {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Department"
        `);

        return result.rows;
    } catch (error) {
        console.error('Error in getDepartments:', error);
        return []; // Return an empty array in case of error
    }
}

/**
 * get department for user
 * @param {number} departmentID
 */
async function getDepartmentForUser(departmentID) {
    try {
        const result = await pool.query(`
            SELECT "Name"
            FROM public."Department"
            WHERE "DepartmentID" = $1
        `, [departmentID]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getDepartmentForUser:', error);
        return []; // Return an empty array in case of error
    }
}


module.exports = {
    getDepartments, getDepartmentForUser
};