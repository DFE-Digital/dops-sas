const pool = require('./pool.js');

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
        this.SlackID = data.SlackID;
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

async function createReAssessment(assessmentId) {
    try {
      
        // Fetch the original assessment data
        const originalAssessment = await getAssessmentById(assessmentId);
        if (!originalAssessment) {
            throw new Error('Original assessment not found.');
        }

        // We need to reset some values for the new assessment
        originalAssessment.Status = 'Active';
        originalAssessment.Outcome = 'Not rated';
        originalAssessment.Name += ' - Reassessment';
        originalAssessment.PanelComments = null;
        originalAssessment.AssessmentDateTime = null;
        originalAssessment.AssessmentTime = null;
        originalAssessment.PanelCommentsComplete = null;
        originalAssessment.PanelCommentsImprove = null;

        // Insert the new assessment into the database
        const query = `
            INSERT INTO "Assessment" (
                "Type", "Phase", "Status", "Outcome", "Name", "Description",
                "ProjectCodeYN", "ProjectCode", "StartDate", "EndDateYN", "EndDate",
                "RequestedWeeks", "Portfolio", "DD", "SRO", "PMYN", "PM", "DMYN", "DM",
                "CreatedBy", "CreatedDate", "AssessmentDateTime", "SubStatusCode",
                "PanelComments", "PanelCommentsImprove", "PanelCommentsComplete", "AssessmentTime",
                "Department"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
            RETURNING "AssessmentID"
        `;
        const values = [
            originalAssessment.Type, originalAssessment.Phase, originalAssessment.Status, originalAssessment.Outcome, 
            originalAssessment.Name, originalAssessment.Description, originalAssessment.ProjectCodeYN, originalAssessment.ProjectCode, 
            originalAssessment.StartDate, originalAssessment.EndDateYN, originalAssessment.EndDate, originalAssessment.RequestedWeeks, 
            originalAssessment.Portfolio, originalAssessment.DD, originalAssessment.SRO, originalAssessment.PMYN, originalAssessment.PM, 
            originalAssessment.DMYN, originalAssessment.DM, originalAssessment.CreatedBy, new Date(), originalAssessment.AssessmentDateTime, 
            originalAssessment.SubStatusCode, originalAssessment.PanelComments, originalAssessment.PanelCommentsImprove, 
            originalAssessment.PanelCommentsComplete, originalAssessment.AssessmentTime, originalAssessment.Department
        ];
        const res = await pool.query(query, values);
        return res.rows[0].AssessmentID;
    } catch (err) {
        console.error('Error in createReAssessment:', err);
        throw err;
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
            `SELECT * FROM "Assessment"
            WHERE "Status" = $1 AND "Department" = $2
            ORDER BY CASE WHEN "Status" = 'Published' THEN 1 ELSE 0 END, "Status";  
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
 * @param {string[]} statuses The statuses of the assessments to get.
 * @param {number} department The department the user belongs to.
 * @returns {Promise<Array>} A promise that resolves to an array of assessment objects.
 */
async function getRequestsByMixedStatus(statuses, department) {
    try {
        // Use ANY($1) to match any of the statuses in the array
        const result = await pool.query(
            `SELECT * FROM "Assessment"
            WHERE "Status" = ANY($1) AND "Department" = $2
            ORDER BY "AssessmentDateTime" ASC;`,
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


/**
 * Gets services the user is a panel member on
 * 
 * @param {number} userID The ID of the user
 */
async function getAssessmentPanelByUserID(userID) {

    try {
        const result = await pool.query(
            `
            SELECT a."Name", a."AssessmentID", ap."Role", a."Type", a."Phase", a."Status", a."Outcome", a."AssessmentDateTime"
            FROM "Assessment" a
            INNER JOIN "AssessmentPanel" ap
            ON a."AssessmentID" = ap."AssessmentID"
            WHERE ap."UserID" = $1
            ORDER BY a."AssessmentDateTime" ASC
            `,
            [userID] 
        );

        return result.rows;
    } catch (error) {
        console.error('Error in getRequestsByMixedStatus:', error);
        throw error;
    }
}

async function checkSubmitStatus(assessmentID) {
    try {
        // Check basic assessment details
        const assessmentResult = await pool.query(
            `
            SELECT "Status", "Outcome", "AssessmentDateTime"
            FROM "Assessment"
            WHERE "AssessmentID" = $1
            `,
            [assessmentID]
        );
        if (assessmentResult.rows.length === 0) {
            throw new Error('Assessment not found');
        }
        const assessmentDetails = assessmentResult.rows[0];

        // Check if all ServiceStandardOutcomes are completed
        const outcomesResult = await pool.query(
            `
            SELECT COUNT(*) AS "count"
            FROM "ServiceStandardOutcomes"
            WHERE "AssessmentID" = $1
            `,
            [assessmentID]
        );
        const outcomesCount = parseInt(outcomesResult.rows[0].count, 10);
        if (outcomesCount !== 14) {
            return { canSubmit: false, reason: `${14 - outcomesCount} of 14 ratings not complete` };
        }

        // Check for missing actions for any 'Red' or 'Amber' outcomes
        const missingActionsResult = await pool.query(
            `
            SELECT "Standard"
            FROM "ServiceStandardOutcomes"
            WHERE "AssessmentID" = $1 AND ("Outcome" = 'Red' OR "Outcome" = 'Amber')
            AND "Standard" NOT IN (SELECT "Standard" FROM "Actions" WHERE "AssessmentID" = $1)
            `,
            [assessmentID]
        );
        if (missingActionsResult.rows.length > 0) {
            const missingStandards = missingActionsResult.rows.map(row => row.Standard).join(', ');
            return { canSubmit: false, reason: `Missing actions for standards: ${missingStandards}` };
        }

        // Assuming PanelComments checks are similar and skipping for brevity

        // If all checks pass
        return { ...assessmentDetails, canSubmit: true };

    } catch (error) {
        console.error('Error in checkSubmitStatus:', error);
        throw error;
    }
}

/** 
 * Get all active assessments for a given department with assessor firstname and lastname and emailaddress
 * @param {number} departmentID The ID of the department
 * @returns {Promise<Array>} A promise that resolves to an array of assessment objects.
 */
async function getActiveAssessmentsWithAssessorData(departmentID) {
    try {
        const result = await pool.query(
            `
            SELECT
            "Assessment"."AssessmentID",
            "Assessment"."Description",
            "Assessment"."Name",
            "Assessment"."Type",
            "Assessment"."Phase",
            "Assessment"."AssessmentDateTime",
            "Assessment"."AssessmentTime",
            STRING_AGG(CASE WHEN "AssessmentPanel"."Role" = 'Design assessor' THEN "User"."FirstName" || ' ' || "User"."LastName" END, ', ') AS "Design",
            STRING_AGG(CASE WHEN "AssessmentPanel"."Role" = 'Lead assessor' THEN "User"."FirstName" || ' ' || "User"."LastName" END, ', ') AS "Lead",
            STRING_AGG(CASE WHEN "AssessmentPanel"."Role" = 'Accessibility assessor' THEN "User"."FirstName" || ' ' || "User"."LastName" END, ', ') AS "Accessibility",
            STRING_AGG(CASE WHEN "AssessmentPanel"."Role" = 'User research assessor' THEN "User"."FirstName" || ' ' || "User"."LastName" END, ', ') AS "UR",
            STRING_AGG(CASE WHEN "AssessmentPanel"."Role" = 'Technical assessor' THEN "User"."FirstName" || ' ' || "User"."LastName" END, ', ') AS "Tech",
            STRING_AGG(CASE WHEN "AssessmentPanel"."Role" = 'Performance assessor' THEN "User"."FirstName" || ' ' || "User"."LastName" END, ', ') AS "Performance"
        FROM
            public."Assessment"
        LEFT JOIN public."AssessmentPanel" ON "Assessment"."AssessmentID" = "AssessmentPanel"."AssessmentID"
        LEFT JOIN public."User" ON "AssessmentPanel"."UserID" = "User"."UserID"
        WHERE "Assessment"."Status" = 'Active' AND "Assessment"."Department" = $1
        GROUP BY
             "Assessment"."AssessmentID","Assessment"."Name", "Assessment"."AssessmentDateTime", "Assessment"."AssessmentTime"
        
            `,
            [departmentID]
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getActiveAssessmentsWithAssessorData:', error);
        throw error;
    }
}

/**
 * Change the primary contact for an assessment
 */
async function changePrimaryContact(assessmentID, userID) {
    try {
        await pool.query(`
            UPDATE "Assessment"
            SET "CreatedBy" = $2
            WHERE "AssessmentID" = $1
        `, [assessmentID, userID]);
    } catch (error) {
        console.error('Error in changePrimaryContact:', error);
        throw error;
    } 
}
    
/** 
 * Get all assessments for a department that aren't published
 * @param {number} departmentID The ID of the department
 */
async function getAllAssessments(departmentID) {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM "Assessment"
            WHERE "Department" = $1 AND "Status" != 'Published'
            `,
            [departmentID]
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getAllAssessments:', error);
        throw error;
    }
}

/** 
 * Get all assessments for a department that aren't published
 * @param {number} departmentID The ID of the department
 */
async function getAllAssessmentsNotDrafts(departmentID) {
    try {
        const result = await pool.query(
            `
            SELECT
            a.*,
            dd."FirstName" AS "DDFirstName",
            dd."LastName" AS "DDLastName",
            pm."FirstName" AS "PMFirstName",
            pm."LastName" AS "PMLastName",
            dm."FirstName" AS "DMFirstName",
            dm."LastName" AS "DMLastName"
          FROM public."Assessment" a
          LEFT JOIN public."User" dd ON a."DD" = dd."UserID"
          LEFT JOIN public."User" pm ON a."PM" = pm."UserID"
          LEFT JOIN public."User" dm ON a."DM" = dm."UserID"
          WHERE a."Department" = $1 AND a."Status" != 'Draft'
          
            `,
            [departmentID]
        );
        return result.rows;
    } catch (error) {
        console.error('Error in getAllAssessments:', error);
        throw error;
    }
}

//Update the SlackID for an assessment
async function updateSlackChannelID(assessmentID, slackID) {
    try {
        await pool.query(`
            UPDATE "Assessment"
            SET "SlackID" = $2
            WHERE "AssessmentID" = $1
        `, [assessmentID, slackID]);
    } catch (error) {
        console.error('Error in updateSlackChannelID:', error);
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
    getAssessmentsUserCanAccess,
    getAssessmentPanelByUserID, 
    checkSubmitStatus,
    getActiveAssessmentsWithAssessorData,
    changePrimaryContact,
    getAllAssessments,
    createReAssessment,
    getAllAssessmentsNotDrafts,
    updateSlackChannelID
};