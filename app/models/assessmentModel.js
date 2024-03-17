const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

class AssessmentModel {
    constructor(data) {
        this.AssessmentID = data.AssessmentID;
        this.Phase = data.Phase;
        this.Type = data.Type;
        this.Name = data.Name;
        this.Description = data.Description;
        this.ProjectCodeYN = data.ProjectCodeYN;
        this.ProjectCode = data.ProjectCode;
        this.StartDate = data.StartDate;
        this.EndDateYN = data.EndDateYN;
        this.EndDate = data.EndDate;
        this.RequestedWeeks = data.RequestedWeeks;
        this.Portfolio = data.Portfolio;
        this.DD = data.DD;
        this.SRO = data.SRO;
        this.PMYN = data.PMYN;
        this.PM = data.PM;
        this.DMYN = data.DMYN;
        this.DM = data.DM;
        this.Status = data.Status;
        this.Outcome = data.Outcome;
        this.CreatedBy = data.CreatedBy;
        this.CreatedDate = data.CreatedDate;
        this.AssessmentDateTime = data.AssessmentDateTime;
        this.AssessmentTime = data.AssessmentTime;
        this.SubStatusCode = data.SubStatusCode;
        this.PanelComments = data.PanelComments;
        this.PanelCommentsComplete = data.PanelCommentsComplete;
        this.PanelCommentsImprove = data.PanelCommentsImprove;
        this.Department = data.Department;
    }
}


async function createAssessment(model, userID) {
    try {
        const { rows } = await pool.query(`
            INSERT INTO "Assessment" (
               "Phase", "CreatedBy", "CreatedDate", "Status", "Outcome", "Department"
            ) VALUES ($1, $2, NOW(), $3, $4, $5)
            RETURNING "AssessmentID"
        `, [model.Phase, userID, 'Draft', 'Not rated', model.Department]);
        return rows[0].AssessmentID;
    } catch (error) {
        console.error('Error in createAssessment:', error);
        throw error;
    }
}

async function getAssessmentById(id) {
    try {
        const { rows } = await pool.query(`
            SELECT * FROM "Assessment"
            WHERE "AssessmentID" = $1
        `, [id]);

        if (rows.length > 0) {
            return new AssessmentModel(rows[0]);
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error in getAssessmentById:', error);
        throw error;
    }
}

async function updateAssessment(id, model, userID) {
    try {
        await pool.query(`
            UPDATE "Assessment" SET
                "Type" = $2,
                "Phase" = $3,
                "Status" = $4,
                "Outcome" = $5,
                "Name" = $6,
                "Description" = $7,
                "ProjectCodeYN" = $8,
                "ProjectCode" = $9,
                "StartDate" = $10,
                "EndDateYN" = $11,
                "EndDate" = $12,
                "RequestedWeeks" = $13,
                "Portfolio" = $14,
                "DD" = $15,
                "SRO" = $16,
                "PMYN" = $17,
                "PM" = $18,
                "DMYN" = $19,
                "DM" = $20,
                "SubStatusCode" = $21,
                "AssessmentDateTime" = $22,
                "AssessmentTime" = $23,
                "PanelComments" = $24,
                "PanelCommentsComplete" = $25,
                "PanelCommentsImprove" = $26
            WHERE "AssessmentID" = $1
        `, [id, model.Type, model.Phase, model.Status, model.Outcome, model.Name, model.Description, model.ProjectCodeYN, model.ProjectCode, model.StartDate, model.EndDateYN, model.EndDate, model.RequestedWeeks, model.Portfolio, model.DD, model.SRO, model.PMYN, model.PM, model.DMYN, model.DM, model.SubStatusCode, model.AssessmentDateTime, model.AssessmentTime, model.PanelComments, model.PanelCommentsComplete, model.PanelCommentsImprove]);

    } catch (error) {
        console.error('Error in updateAssessment:', error);
        throw error;
    }
}

/**
 * Gets draft assessments which have been created by the signed in user
 * @param {number} userID - The ID of the user
 */
async function getDraftsForUser(userID) {
    try {
        const query = `
            SELECT * 
            FROM "Assessment"
            WHERE "CreatedBy" = $1 AND "Status" = 'Draft';
        `;

        const { rows } = await pool.query(query, [userID]);
        return rows;
    } catch (error) {
        console.error('Error in getDraftsForUser:', error);
        throw error;
    }
}

/**
 * Deletes an assessment entry from the database
 * @param {number} assessmentID of the entry to delete 
 */
async function deleteAssessment(id) {
    try {
        await pool.query(`
            DELETE FROM "Assessment"
            WHERE "AssessmentID" = $1
        `, [id]);
    } catch (error) {
        console.error('Error in deleteAssessment:', error);
        throw error;
    }
}

/**
 * Gets assessments by status for the department the user belongs to.
 * @param {string} status The status of the assessments to get.
 * @param {number} department The department the user belongs to.
 * @returns {Promise<Array>} A promise that resolves to an array of assessment objects.
 */
async function getRequestsByStatus(status, department) {

    try {
        const result = await pool.query(
            `
          SELECT * FROM "Assessment"
          WHERE "Status" = $1 AND "Department" = $2
        `,
            [status, department]
        );

        return result.rows;
    } catch (error) {
        console.error('Error in getRequestsByStatus:', error);
        throw error;
    }
}

/**
* Gets assessments by status for the department the user belongs to.
* @param {string} status The status of the assessments to get.
* @param {number} department The department the user belongs to.
* @returns {Promise<Array>} A promise that resolves to an array of assessment objects.
*/
async function getRequestsByMixedStatus(statuses, department) {
    try {
        // Use ANY($1) to match any of the statuses in the array
        const result = await pool.query(
            `
            SELECT * FROM "Assessment"
            WHERE "Status" = ANY($1) AND "Department" = $2
            `,
            [statuses, department] // Pass statuses as an array
        );

        return result.rows;
    } catch (error) {
        console.error('Error in getRequestsByMixedStatus:', error);
        throw error;
    }
}

/**
* Gets assessments that the given user can access.
* this includes where they created the assessment, are the DD, PM, or DM
* also needs to include where they are also in the AssessmentTeam table
*/
async function getAssessmentsUserCanAccess(userID) {
    try {
        const result = await pool.query(
            `
            SELECT DISTINCT * FROM "Assessment"
            WHERE "CreatedBy" = $1
            OR "DD" = $1
            OR "PM" = $1
            OR "DM" = $1
            OR "AssessmentID" IN (
                SELECT "AssessmentID" FROM "AssessmentTeam" WHERE "UserID" = $1
            )
            
            `,
            [userID] 
        );

        return result.rows;
    } catch (error) {
        console.error('Error in getRequestsByMixedStatus:', error);
        throw error;
    }
}






module.exports = {
    AssessmentModel,
    createAssessment,
    getAssessmentById,
    updateAssessment,
    getDraftsForUser,
    deleteAssessment,
    getRequestsByStatus,
    getRequestsByMixedStatus,
    getAssessmentsUserCanAccess
};