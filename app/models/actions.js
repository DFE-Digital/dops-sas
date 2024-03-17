const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


/**
 * Get actions for an assessment
 */
async function getActionsForAssessmentID(assessmentID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Actions"
            WHERE "AssessmentID" = $1
        `, [assessmentID]);

        // Return all rows (roles) instead of a single role
        return result.rows;
    } catch (error) {
        console.error('Error in getActionsForAssessmentID:', error);
        return []; // Return an empty array in case of error
    }
}

module.exports = {
    getActionsForAssessmentID
};