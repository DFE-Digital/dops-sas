const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


/**
 * Get actions for an assessment
 * @param {number} assessmentID The unique identifier of the assessment.
 */
async function getTeamForAssessmentExtended(assessmentID) {
    try {
        const result = await pool.query(`
            SELECT at.*, u."FirstName", u."LastName", u."EmailAddress"
            FROM public."AssessmentTeam" at
            LEFT JOIN "User" u ON at."UserID" = u."UserID"
            WHERE "AssessmentID" = $1
        `, [assessmentID]);

        // Return all rows (roles) instead of a single role
        return result.rows;
    } catch (error) {
        console.error('Error in getTeamForAssessment:', error);
        return []; // Return an empty array in case of error
    }
}

/**
 * Add a team member to an assessment
 * 
 */
async function addTeam(AssessmentID, UserID, Role) {
    try {
        const { rows } = await pool.query(`
            INSERT INTO public."AssessmentTeam" (
                "AssessmentID", "UserID", "Role"
            ) VALUES ($1, $2, $3)
            RETURNING "ID"
        `, [AssessmentID, UserID, Role]);
        return rows[0].ID;
    } catch (error) {
        console.error('Error in addTeam:', error);
        throw error;
    }
}

/** 
 * Get a team member by the ID and UniqueID
 * @param {number} id The unique identifier of the team member.
 * @param {uuid} uniqueID The unique identifier of the team member.   
 */
async function getTeamMemberForIdAndUniqueID(id, uniqueID) {
    try {
        const result = await pool.query(`
        SELECT at.*, u."FirstName", u."LastName", u."EmailAddress"
        FROM public."AssessmentTeam" at
        LEFT JOIN "User" u ON at."UserID" = u."UserID"
            WHERE at."ID" = $1 AND at."UniqueID" = $2
        `, [id, uniqueID]);

        if (result.rows.length > 0) {
            return result.rows[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error in getTeamMemberForIdAndUniqueID:', error);
        throw error;
    }
}


/**
 * Delete team member by ID
 * @param {number} id The unique identifier of the team member.
 */
async function deleteTeamMemberByID(id) {
    try {
        await pool.query(`
            DELETE FROM public."AssessmentTeam"
            WHERE "ID" = $1
        `, [id]);
    } catch (error) {
        console.error('Error in deleteTeamMemberByID:', error);
        throw error;
    }
}



module.exports = {
    getTeamForAssessmentExtended, addTeam, getTeamMemberForIdAndUniqueID, deleteTeamMemberByID
};