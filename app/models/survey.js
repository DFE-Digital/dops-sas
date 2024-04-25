const pool = require('./pool.js');



/**
 * Add a survey record to the SurveyData table
 * @param {string} AssessmentID - The ID of the assessment.
 * @param {string} UserID - The ID of the user.
 * @param {number} preAssessmentCall - Rating for pre-assessment call.
 * @param {number} organisationOfServiceAssessment - Rating for organisation of the service assessment.
 * @param {number} runningOfAssessment - Rating for the running of the assessment on the day.
 * @param {string} feedbackOnLowScores - Feedback on items scored between 1 and 3.
 * @param {string} specificFeedbackForAssessor - Specific feedback for the assessor panel.
 * @param {string} furtherComments - Any further comments or suggestions.
 */
async function addSurvey(
    AssessmentID,
    UserID,
    preAssessmentCall,
    organisationOfServiceAssessment,
    runningOfAssessment,
    feedbackOnLowScores,
    specificFeedbackForAssessor,
    furtherComments
) {
    try {
        const { rows } = await pool.query(`
            INSERT INTO public."SurveyData" (
                "AssessmentID",
                "UserID",
                "preAssessmentCall",
                "organisationOfServiceAssessment",
                "runningOfAssessment",
                "feedbackOnLowScores",
                "specificFeedbackForAssessor",
                "furtherComments"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id;
        `, [
            AssessmentID,
            UserID,
            preAssessmentCall,
            organisationOfServiceAssessment,
            runningOfAssessment,
            feedbackOnLowScores,
            specificFeedbackForAssessor,
            furtherComments
        ]);
        return rows[0].id;  // Return the ID of the newly created survey record
    } catch (error) {
        console.error('Error in addSurvey:', error);
        throw error;
    }
}

module.exports = {
    addSurvey
};