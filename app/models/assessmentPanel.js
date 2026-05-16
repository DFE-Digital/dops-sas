const pool = require('./pool.js');

/**
 * Gets the people on the assessment panel for a given assessment.
 * @param {number} assessmentID The unique identifier of the assessment.
 * @returns {Promise<Array>} An array of the panel members, or an empty array if no panel members are found.
 */
async function assessmentPanel(assessmentID) {
  
    try {
      // Validate assessmentID is a valid integer
      if (assessmentID === null || assessmentID === undefined || isNaN(assessmentID) || !Number.isInteger(assessmentID)) {
        console.error('Invalid assessmentID provided to assessmentPanel:', assessmentID);
        return [];
      }

      const result = await pool.query(
        `
          SELECT * FROM "AssessmentPanel"
          WHERE "AssessmentID" = $1
        `,
        [assessmentID]
      );
  
      return result.rows;
    } catch (error) {
      console.error('Error in assessmentPanel:', error);
      throw error;
    }
  }

/**
 * Gets the people on the assessment panel for a given assessment, including their details.
 * @param {number} assessmentID The unique identifier of the assessment.
 * @returns {Promise<Array>} An array of the panel members with their details, or an empty array if no panel members are found.
 */
async function assessmentPanelExtended(assessmentID) {
    try {
        const result = await pool.query(
            `
            SELECT ap.*, u."FirstName", u."LastName", u."EmailAddress"
            FROM "AssessmentPanel" ap
            LEFT JOIN "User" u ON ap."UserID" = u."UserID"
            WHERE ap."AssessmentID" = $1
            `,
            [assessmentID]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error in assessmentPanelExtended:', error);
        throw error;
    }
}

/**
 * Gets the active assessors.
 * @returns {Promise<Array>} An array of the active assessors, or an empty array if no active assessors are found.
*/
async function getActiveAssessors() {
    try {
        const result = await pool.query(
            `
            SELECT a.*, u."FirstName", u."LastName", u."EmailAddress"
            FROM "Assessor" a
            LEFT JOIN "User" u ON a."UserID" = u."UserID"
            WHERE a."Active" = true
            `
        );

        return result.rows;
    } catch (error) {
        console.error('Error in getActiveAssessors:', error);
        throw error;
    }
}


/**
 * Adds a panel member to an assessment.
 * @param {string} role The role of the panel member.
 * @param {number} userID The unique identifier of the user.
 * @param {number} assessmentID The unique identifier of the assessment.
 * */
async function addPanelMember(assessmentID, userID, role) {
    try {
        const insertQuery = `
            INSERT INTO "AssessmentPanel" ("Role", "UserID", "AssessmentID")
            VALUES ($1, $2, $3)
            RETURNING "AssessmentPanelID";
        `;

        // Execute the query and get the result
        const result = await pool.query(insertQuery, [role, userID, assessmentID]);

        // result.rows[0] contains the first row of the result set, which in this case should be the new ID
        if (result.rows.length > 0) {
            return result.rows[0].AssessmentPanelID; // Returns the ID of the newly inserted panel member
        } else {
            throw new Error('Panel member was not added successfully.');
        }
    } catch (error) {
        console.error('Error in addPanelMember:', error);
        throw error;
    }
}


async function findAssessmentPanelByIdAndUniqueID(assessmentPanelID, uniqueID) {
    try {
        const query = `
          SELECT 
            AP.*,
            A."Name" AS "AssessmentName",
            U."FirstName",
            U."LastName"
          FROM "AssessmentPanel" AP
          INNER JOIN "Assessment" A ON AP."AssessmentID" = A."AssessmentID"
          INNER JOIN "User" U ON AP."UserID" = U."UserID"
          WHERE AP."AssessmentPanelID" = $1 AND AP."UniqueID" = $2
        `;

        // Execute the query and get the result
        const result = await pool.query(query, [assessmentPanelID, uniqueID]);

        // result.rows contains the rows of the result set
        if (result.rows.length > 0) {
            return result.rows[0]; // Returns the details of the found panel member
        } else {
            // Optionally, handle the case where no panel member is found
            console.log('No panel member found with the given identifiers.');
            return null;
        }
    } catch (error) {
        console.error('Error in findAssessmentPanelByIdAndUniqueID:', error);
        throw error;
    }
}

/**
* Delete a panel member from an assessment.
* @param {uuid} uniqueID The unique identifier of the panel member.
*/
async function deleteAssessmentPanelMember(uniqueID) {
    try {
        // Execute the DELETE query
        await pool.query(
            `
            DELETE FROM "AssessmentPanel"
            WHERE "UniqueID" = $1
            `, 
            [uniqueID] 
        );
        console.log('Panel member successfully deleted.'); // Optional: Confirm deletion
    } catch (error) {
        console.error('Error in deleteAssessmentPanelMember:', error);
        throw error;
    }
}

/**
 * Gets all assessors who have served on assessment panels, with assessment counts,
 * RAG outcome counts, and per-assessment panel roles.
 * @returns {Promise<Array>}
 */
async function getAllPanelAssessorsSummary() {
    try {
        const { rows: assessors } = await pool.query(`
            SELECT
                ap."UserID",
                u."FirstName",
                u."LastName",
                u."EmailAddress",
                a."AssessorID",
                a."PrimaryRole",
                COALESCE(a."DepartmentID", u."Department") AS "DepartmentID",
                d."Name" AS "DepartmentName",
                COUNT(DISTINCT ap."AssessmentID")::int AS "AssessmentCount"
            FROM "AssessmentPanel" ap
            INNER JOIN "User" u ON ap."UserID" = u."UserID"
            LEFT JOIN "Assessor" a ON ap."UserID" = a."UserID" AND (a."Deleted" = false OR a."Deleted" IS NULL)
            LEFT JOIN "Department" d ON COALESCE(a."DepartmentID", u."Department") = d."DepartmentID"
            GROUP BY
                ap."UserID",
                u."FirstName",
                u."LastName",
                u."EmailAddress",
                a."AssessorID",
                a."PrimaryRole",
                a."DepartmentID",
                u."Department",
                d."Name"
            ORDER BY u."LastName" ASC, u."FirstName" ASC
        `);

        const { rows: outcomeCounts } = await pool.query(`
            SELECT
                sso."CreatedBy" AS "UserID",
                SUM(CASE WHEN sso."Outcome" = 'Red' THEN 1 ELSE 0 END)::int AS "Red",
                SUM(CASE WHEN sso."Outcome" = 'Amber' THEN 1 ELSE 0 END)::int AS "Amber",
                SUM(CASE WHEN sso."Outcome" = 'Green' THEN 1 ELSE 0 END)::int AS "Green"
            FROM "ServiceStandardOutcomes" sso
            INNER JOIN "AssessmentPanel" ap
                ON sso."AssessmentID" = ap."AssessmentID"
                AND sso."CreatedBy" = ap."UserID"
            WHERE sso."Outcome" IN ('Red', 'Amber', 'Green')
            GROUP BY sso."CreatedBy"
        `);

        const { rows: assessments } = await pool.query(`
            SELECT
                ap."UserID",
                a."AssessmentID",
                a."Name",
                ap."Role" AS "PanelRole",
                a."Type",
                a."Phase",
                a."Status",
                a."Outcome",
                a."AssessmentDateTime"
            FROM "AssessmentPanel" ap
            INNER JOIN "Assessment" a ON ap."AssessmentID" = a."AssessmentID"
            ORDER BY ap."UserID" ASC, a."AssessmentDateTime" DESC NULLS LAST
        `);

        const outcomesByUser = {};
        outcomeCounts.forEach((row) => {
            outcomesByUser[row.UserID] = {
                Red: row.Red,
                Amber: row.Amber,
                Green: row.Green
            };
        });

        const assessmentsByUser = {};
        assessments.forEach((row) => {
            if (!assessmentsByUser[row.UserID]) {
                assessmentsByUser[row.UserID] = [];
            }
            assessmentsByUser[row.UserID].push({
                AssessmentID: row.AssessmentID,
                Name: row.Name,
                PanelRole: row.PanelRole,
                Type: row.Type,
                Phase: row.Phase,
                Status: row.Status,
                Outcome: row.Outcome,
                AssessmentDateTime: row.AssessmentDateTime
            });
        });

        return assessors.map((assessor) => ({
            UserID: assessor.UserID,
            AssessorID: assessor.AssessorID,
            FirstName: assessor.FirstName,
            LastName: assessor.LastName,
            EmailAddress: assessor.EmailAddress,
            PrimaryRole: assessor.PrimaryRole,
            DepartmentID: assessor.DepartmentID,
            DepartmentName: assessor.DepartmentName,
            AssessmentCount: assessor.AssessmentCount,
            Outcomes: outcomesByUser[assessor.UserID] || { Red: 0, Amber: 0, Green: 0 },
            Assessments: assessmentsByUser[assessor.UserID] || []
        }));
    } catch (error) {
        console.error('Error in getAllPanelAssessorsSummary:', error);
        throw error;
    }
}

module.exports = {
    assessmentPanel,
    assessmentPanelExtended,
    getActiveAssessors,
    addPanelMember,
    findAssessmentPanelByIdAndUniqueID,
    deleteAssessmentPanelMember,
    getAllPanelAssessorsSummary
};