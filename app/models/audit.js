const pool = require('./pool.js');

async function addAuditEntry(AssessmentID, Action, Comments, UserID) {
    try {
        await pool.query(`
            INSERT INTO public."Audit" ("AssessmentID", "Action", "Comments", "CreatedBy", "Created")
            VALUES ($1, $2, $3, $4, NOW())
        `, [AssessmentID, Action, Comments, UserID]);
    }
    catch (error) {
        console.error('Error in addAuditAction:', error);
        throw error;
    }
}



module.exports = {
    addAuditEntry}