const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

/**
 * Gets the people on the assessment panel for a given assessment.
 * @param {number} assessmentID The unique identifier of the assessment.
 * @returns {Promise<Array>} An array of the panel members, or an empty array if no panel members are found.
 */
async function assessmentPanel(assessmentID) {
  
    try {
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

module.exports = {
    assessmentPanel, assessmentPanelExtended, getActiveAssessors, addPanelMember, findAssessmentPanelByIdAndUniqueID, deleteAssessmentPanelMember
};