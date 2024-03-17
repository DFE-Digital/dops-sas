const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


/**
 * get all service standards
 * @returns {Promise<Array>} An array of the service standards, or an empty array if no standards are found.
 */
async function getServiceStandards() {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."ServiceStandards"
        `);

        return result.rows;
    } catch (error) {
        console.error('Error in getServiceStandards:', error);
        return []; // Return an empty array in case of error
    }
}

/**
 * get service standard outcomes by assessment id
 * @param {number} assessmentID The unique identifier of the assessment.
 * @returns {Promise<Array>} An array of the service standard outcomes, or an empty array if no outcomes are found.
 */
async function getServiceStandardOutcomesByAssessmentID(assessmentID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."ServiceStandardOutcomes"
            WHERE "AssessmentID" = $1
        `, [assessmentID]);

        return result.rows;
    } catch (error) {
        console.error('Error in getServiceStandardOutcomesByAssessmentID:', error);
        return []; // Return an empty array in case of error
    }   
}

module.exports = {
    getServiceStandards, getServiceStandardOutcomesByAssessmentID
};