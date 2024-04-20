const { Pool } = require('pg');
const { copy } = require('../routes');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


/**
 * Get actions for an assessment
 */
async function getArtefactsForAssessment(assessmentID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."AssessmentArtefacts"
            WHERE "AssessmentID" = $1
        `, [assessmentID]);

        // Return all rows (roles) instead of a single role
        return result.rows;
    } catch (error) {
        console.error('Error in getArtefactsForAssessment:', error);
        return []; // Return an empty array in case of error
    }
}


/**
 * Add an artefact to an assessment
 * @param {number} AssessmentID The unique identifier of the assessment.
 * @param {string} Title The title of the artefact.
 * @param {string} Description The description of the artefact.
 * @param {string} URL The URL of the artefact.
 * @param {number} UserID The person adding it.
 */
async function addArtefact(AssessmentID, Title, Description, URL, UserID) {
    try {
        const { rows } = await pool.query(`
            INSERT INTO public."AssessmentArtefacts" (
                "AssessmentID", "Title", "Description", "URL", "Created", "CreatedBy"
            ) VALUES ($1, $2, $3, $4, NOW(), $5)
            RETURNING "ArtefactID"
        `, [AssessmentID, Title, Description, URL, UserID]);
        return rows[0].ArtefactID;
    } catch (error) {
        console.error('Error in addAertefact:', error);
        throw error;
    }
}

/**
 * Find an artefact by ArtefactID and UniqueID
 * @param {number} ArtefactID The unique identifier of the artefact.
 * @param {uuid} UniqueID The unique identifier of the artefact.
 */
async function getArtefactByIdAndUniqueID(ArtefactID, UniqueID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."AssessmentArtefacts"
            WHERE "ArtefactID" = $1 AND "UniqueID" = $2
        `, [ArtefactID, UniqueID]);

        if (result.rows.length > 0) {
            return result.rows[0];
        } else {
            console.log(`No artefact found with ArtefactID: ${ArtefactID} and UniqueID: ${UniqueID}`);
            return null;
        }
    } catch (error) {
        console.error('Error in getArtefactByIdAndUniqueID:', error);
        throw error;
    }
}

/**
 * Delete an artefact
 * @param {number} ArtefactID The unique identifier of the artefact.
 */
async function deleteArtefact(ArtefactID) {
    try {
        await pool.query(`
            DELETE FROM public."AssessmentArtefacts"
            WHERE "ArtefactID" = $1
        `, [ArtefactID]);
    } catch (error) {
        console.error('Error in deleteArtefact:', error);
        throw error;
    }
}

/**
 * Copy artefacts from one assessment to another
 * @param {number} sourceAssessmentID The unique identifier of the source assessment.
 * @param {number} targetAssessmentID The unique identifier of the target assessment.
 */
async function copyArtefacts(sourceAssessmentID, targetAssessmentID) {
    try {
        const { rowCount } = await pool.query(`
            INSERT INTO public."AssessmentArtefacts" (
                "AssessmentID", "Title", "Description", "URL", "Created", "CreatedBy"
            )
            SELECT $2, "Title", "Description", "URL", NOW(), "CreatedBy"
            FROM public."AssessmentArtefacts"
            WHERE "AssessmentID" = $1
        `, [sourceAssessmentID, targetAssessmentID]);

        return rowCount;
    } catch (error) {
        console.error('Error in copyArtefacts:', error);
        throw error;
    }
}


module.exports = {
    getArtefactsForAssessment, addArtefact, getArtefactByIdAndUniqueID, deleteArtefact, copyArtefacts
};

