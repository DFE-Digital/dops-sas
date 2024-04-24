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
            ORDER BY "Point" ASC
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

/**
 * get service standard outcomes
 */
async function getStandardOutcomes() {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."ServiceStandardOutcomes"
        `);

        return result.rows;
    } catch (error) {
        console.error('Error in getStandardOutcomes:', error);
        return []; // Return an empty array in case of error
    }
}


/**
 * Count outcomes by standard and outcome type for a given year.
 * @param {number} year - The given year to filter the outcomes by.
 * @returns {Promise<Array>} - The aggregated outcome counts by standard and outcome type.
 */
async function countOutcomesByStandard(department) {
    try {
        const result = await pool.query(`
            SELECT 
                "Standard",
                SUM(CASE WHEN a."Outcome" = 'Red' THEN 1 ELSE 0 END) AS "RedCount",
                SUM(CASE WHEN a."Outcome" = 'Amber' THEN 1 ELSE 0 END) AS "AmberCount",
                SUM(CASE WHEN a."Outcome" = 'Green' THEN 1 ELSE 0 END) AS "GreenCount"
            FROM 
                public."ServiceStandardOutcomes" sso
            INNER JOIN public."Assessment" a ON sso."AssessmentID" = a."AssessmentID"
            WHERE 
                AND a."Status" = 'Published' 
                AND a."Department" = $1
            GROUP BY 
                "Standard"
        `, [department]);

        return result.rows;
    } catch (error) {
        console.error('Error in countOutcomesByStandard:', error);
        return []; // Return an empty array in case of an error
    }
}



/**
 * Fetches assessment details for a given year where the status is 'Published'.
 * @param {number} year - The year to filter assessments by.
 * @param {number} department - The department to filter assessments by.
 * @returns {Promise<Array>} - A promise that resolves to an array of assessment details.
 */
async function getAssessmentDetailsByYear(department) {
    try {
        const query = `
            SELECT sso."AssessmentID", sso."Standard", sso."Outcome", a."Name"
            FROM "ServiceStandardOutcomes" sso
            INNER JOIN "Assessment" a ON sso."AssessmentID" = a."AssessmentID"
            WHERE a."Status" = 'Published'
            AND a."Department" = $1
            ORDER BY sso."Standard" ASC;
        `;
        const { rows } = await pool.query(query, [department]);
        return rows;
    } catch (error) {
        console.error('Error in getAssessmentDetailsByYear:', error);
        throw error; // Or handle it as needed
    }
}

/**
 * Insert or update the service standard outcome AssessmentID, Standard, outcomerag, user.UserID
 * If a record already exists for the given assessment and standard, the outcome is updated.
 * @param {number} assessmentID The unique identifier of the assessment.
 * @param {number} standard The standard of the assessment.
 * @param {string} outcome The outcome of the assessment.
 * @param {number} userID The unique identifier of the user.
 * @returns {Promise<number>} The number of rows affected by the update.
 */
async function updateServiceStandardOutcome(assessmentID, standard, outcome, userID) {
    try {
        const { rowCount } = await pool.query(`
            INSERT INTO public."ServiceStandardOutcomes" ("AssessmentID", "Standard", "Outcome", "CreatedBy", "Created")
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT ("AssessmentID", "Standard")
            DO UPDATE SET
                "Outcome" = EXCLUDED."Outcome",
                "CreatedBy" = EXCLUDED."CreatedBy"
        `, [assessmentID, standard, outcome, userID]);

        return rowCount;
    } catch (error) {
        console.error('Error in updateServiceStandardOutcome:', error);
        throw error; // Or handle it as needed
    }
}

/**
 * Check if the user can submit the assessment
 * @param {number} assessmentID The unique identifier of the assessment.
 * @param {number} userID The unique identifier of the user.
 * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating if the user can submit the assessment.
 */
async function canSubmit(assessmentID, userID) {
    try {
        const { rows } = await pool.query(`
            SELECT "UserID"
            FROM public."AssessmentPanel"
            WHERE "AssessmentID" = $1 AND "Role" = $2
        `, [assessmentID, 'Lead assessor']);

        // Check if user is part of the assessment team
        const isUserAllowed = rows.some(row => row["UserID"] === userID);

        // Additionally, check if all required actions have been completed for 'Red' or 'Amber' standards
        const actionCheckResult = await pool.query(`
            SELECT CASE 
                WHEN NOT EXISTS (
                    SELECT 1
                    FROM public."ServiceStandardOutcomes" sso
                    LEFT JOIN public."Actions" a 
                        ON sso."Standard" = a."Point" 
                        AND sso."AssessmentID" = a."AssessmentID"
                    WHERE sso."AssessmentID" = $1
                        AND sso."Outcome" IN ('Red', 'Amber')
                        AND a."ActionID" IS NULL
                )
                THEN true
                ELSE false
            END AS "AllActionsComplete"
        `, [assessmentID]);

        // Final condition to submit: User must be allowed and all actions must be complete
        return isUserAllowed && actionCheckResult.rows[0].AllActionsComplete;
    } catch (error) {
        console.error('Error in canSubmit:', error);
        throw error; // Or handle it as needed
    }
}


module.exports = {
    getServiceStandards, getServiceStandardOutcomesByAssessmentID, countOutcomesByStandard, getAssessmentDetailsByYear, updateServiceStandardOutcome, canSubmit, getStandardOutcomes
};