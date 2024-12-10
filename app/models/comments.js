const pool = require('./pool.js');

/**
 * Get comments for an assessment
 * @param {integer} assessmentID The ID of the assessment.
 */
async function getCommentsForAssessmentID(assessmentID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Comments"
            WHERE "AssessmentID" = $1
            ORDER BY "Created" ASC
        `, [assessmentID]);

        return result.rows;
    } catch (error) {
        console.error('Error in getCommentsForAssessmentID:', error);
        return [];
    }
}

/**
 * Add a comment to the database
 * @param {integer} assessmentID The ID of the assessment.
 * @param {string} comments The comment text.
 * @param {integer} point The point related to the comment.
 * @param {integer} createdBy The user ID who created the comment.
 */
async function addComment(assessmentID, comments, point, createdBy) {
    try {
        await pool.query(`
            INSERT INTO public."Comments" ("AssessmentID", "Comments", "Point", "CreatedBy", "Created", "Status", "UniqueID")
            VALUES ($1, $2, $3, $4, NOW(), 'Open', gen_random_uuid())
        `, [assessmentID, comments, point, createdBy]);
    } catch (error) {
        console.error('Error in addComment:', error);
        throw error;
    }
}

/**
 * Get a comment by unique ID
 * @param {uuid} uniqueID The unique identifier of the comment.
 */
async function getCommentByUniqueID(uniqueID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Comments"
            WHERE "UniqueID" = $1
        `, [uniqueID]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getCommentByUniqueID:', error);
        return {};
    }
}

/**
 * Update a comment by unique ID
 * @param {uuid} uniqueID The unique identifier of the comment.
 * @param {string} comments The updated comment text.
 */
async function updateComment(uniqueID, comments) {
    try {
        await pool.query(`
            UPDATE public."Comments"
            SET "Comments" = $2
            WHERE "UniqueID" = $1
        `, [uniqueID, comments]);
    } catch (error) {
        console.error('Error in updateComment:', error);
        throw error;
    }
}

/**
 * Delete a comment by unique ID
 * @param {uuid} uniqueID The unique identifier of the comment.
 */
async function deleteComment(uniqueID) {
    try {
        await pool.query(`
            DELETE FROM public."Comments"
            WHERE "UniqueID" = $1
        `, [uniqueID]);
    } catch (error) {
        console.error('Error in deleteComment:', error);
        throw error;
    }
}

/**
 * Get comments for an assessment and point
 * @param {integer} assessmentID The ID of the assessment.
 * @param {integer} point The point associated with the comment.
 */
async function getCommentsForAssessmentIDAndPoint(assessmentID, point) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Comments"
            WHERE "AssessmentID" = $1 AND "Point" = $2
        `, [assessmentID, point]);

        return result.rows;
    } catch (error) {
        console.error('Error in getCommentsForAssessmentIDAndPoint:', error);
        return [];
    }
}

module.exports = {
    getCommentsForAssessmentID,
    addComment,
    getCommentByUniqueID,
    updateComment,
    deleteComment,
    getCommentsForAssessmentIDAndPoint
};
