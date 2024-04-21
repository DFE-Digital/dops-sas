const { addSurvey } = require('../models/survey');
const { getAssessmentById} = require('../models/assessmentModel');


exports.g_survey = async (req, res) => {
    const { assessmentID } = req.params

    const assessment = await getAssessmentById(assessmentID);
    console.log('survey')
    return res.render('survey/form', {assessment})
};


exports.g_surveyComplete = async (req, res) => {
    console.log('survey complete')
    return res.render('survey/complete')
};



exports.p_submitSurvey = async (req, res) => {
    const { assessmentID } = req.body;

    const userID = req.session.data.User.UserID;

   const response =  await addSurvey(
    assessmentID,
        userID,
        req.body.preass,
        req.body.org,
        req.body.ass,
        req.body.feedbackOnLowScores,
        req.body.specificFeedbackForAssessor,
        req.body.furtherComments
    );

    return res.render('survey/complete')
};