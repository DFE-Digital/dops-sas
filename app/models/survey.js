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

/**
 * Add a survey record to the SurveyData table
 * @param {number} departmentID - The ID of the department to get survey data for.
 */
async function getSurveyData(
    departmentID
) {
    try {
        const { rows } = await pool.query(`
            SELECT a.*, s.*
            FROM 
                public."SurveyData" s
            INNER JOIN public."Assessment" a ON s."AssessmentID" = a."AssessmentID"
            WHERE 
               a."Department" = $1
            ORDER BY 
                s."id" DESC
        `, [
            departmentID
        ]);
        return rows; 
    } catch (error) {
        console.error('Error in getSurveyData:', error);
        throw error;
    }
}

/**
 * Add a survey record to the SurveyData table
 * @param {number} surveyID - The ID of the survey to get survey data for.
 */
async function getSurvey(
    surveyID
) {
    try {
        const { rows } = await pool.query(`
            SELECT a.*, s.*
            FROM 
                public."SurveyData" s
            INNER JOIN public."Assessment" a ON s."AssessmentID" = a."AssessmentID"
            WHERE 
               s."id" = $1
        `, [
            surveyID
        ]);
        return rows[0]; 
    } catch (error) {
        console.error('Error in getSurveyData:', error);
        throw error;
    }
}



module.exports = {
    addSurvey, getSurveyData, getSurvey
};