const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


/**
 * Gets assessors
 * @param {number} departmentID The depaertment ID to filter assessors by.
 * @returns {Promise<Array>} An array of assessors, or an empty array if no assessors are found.
 */
async function getAllAssessors(departmentID) {
    try {
        const result = await pool.query(`
            SELECT a.*, u."FirstName", u."LastName", u."EmailAddress"
            FROM public."Assessor" a
            INNER JOIN public."User" u ON a."UserID" = u."UserID"
            WHERE u."Department" = $1
        `, [departmentID]);

        return result.rows;
    } catch (error) {
        console.error('Error in getAllAssessors:', error);
        return []; // Return an empty array in case of error
    }
}


/**
 * Adds an assessor to the database
 * 
 * @param {*} UserID 
 * @param {*} Role 
 * @param {*} CrossGovAssessor 
 * @param {*} LeadAssessor 
 * @param {*} ExternalAssessor 
 */
async function createAssessor(UserID, Role, CrossGovAssessor, LeadAssessor, ExternalAssessor) {

    try {
        await pool.query(`
            INSERT INTO public."Assessor" ("UserID", "PrimaryRole", "Active","CrossGovAssessor", "LeadAssessor", "ExternalAssessor", "DepartmentID")
            VALUES ($1, $2, true, $3, $4, $5, 1)
        `, [UserID, Role, CrossGovAssessor, LeadAssessor, ExternalAssessor]);
    } catch (error) {
        console.error('Error in createAssessor:', error);
        throw error;
    }

}





module.exports = {
    getAllAssessors, createAssessor
};