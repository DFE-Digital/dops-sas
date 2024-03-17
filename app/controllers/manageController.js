/**
 *  Manage routes contoller
 * 
 *  This file defines the controllers for the authenticated pages of the manage section.
 * 
 *  Functions that start with g_ are GET requests.
 *  Functions that start with p_ are POST requests.
 * 
 *  Built by Andy Jones - DesignOps - Department for Education
 * 
 */
const { getAssessmentsUserCanAccess, getAssessmentById } = require('../models/assessmentModel');

exports.g_manage = async (req, res) => {

    const user = req.session.data.User; 
    const assessments = await getAssessmentsUserCanAccess(user.UserID);

    res.render('manage/index', {assessments})
}

exports.g_overview = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    return res.render('manage/entry/overview', { assessment });
}

