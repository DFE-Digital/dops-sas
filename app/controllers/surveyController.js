const { addSurvey } = require('../models/survey');
const { getAssessmentById } = require('../models/assessmentModel');

exports.g_survey = async (req, res) => {
    try {
        const { assessmentID } = req.params
        const assessment = await getAssessmentById(assessmentID);
        return res.render('survey/form', { assessment })
    }
    catch (error) {
        next(error)
    }
};

exports.g_surveyComplete = async (req, res) => {
    try {
        return res.render('survey/complete')
    }
    catch (error) {
        next(error)
    }
};

// TODO: #70 Change to validation model approach
exports.p_submitSurvey = async (req, res) => {
    try {
        const { assessmentID } = req.body;
        const userID = req.session.data.User.UserID;
        const response = await addSurvey(
            assessmentID,
            userID,
            req.body.preass,
            req.body.org,
            req.body.ass,
            req.body.feedbackOnLowScores,
            req.body.specificFeedbackForAssessor,
            req.body.furtherComments
        );

        return res.render('survey/complete');
    }
    catch (error) {
        next(error)
    }
};