const { check, validationResult } = require('express-validator');
const { getAssessmentPanelByUserID, getRequestsByMixedStatus, getAssessmentById, updateReportComments, updateAssessment, checkSubmitStatus } = require('../models/assessmentModel');
const { getServiceStandards, getServiceStandardOutcomesByAssessmentID, countOutcomesByStandard, getAssessmentDetailsByYear, updateServiceStandardOutcome, canSubmit } = require('../models/standards');
const { getActionsForAssessmentID, addAction, getActionByUniqueID, updateAction, deleteAction, getActionsForAssessmentIDAndStandard } = require('../models/actions');
const { assessmentPanel, assessmentPanelExtended, getActiveAssessors, addPanelMember, findAssessmentPanelByIdAndUniqueID, deleteAssessmentPanelMember } = require('../models/assessmentPanel');
const { getArtefactsForAssessment } = require('../models/artefacts');
const { getTeamForAssessmentExtended } = require('../models/team');
const { validateAddRating, validateAddAction, validateAddComments } = require('../validation/assess');
const { sendNotifyEmail } = require('../middleware/notify');

exports.g_index = async function (req, res) {
    const user = req.session.data.User;
    const userOnPanels = await getAssessmentPanelByUserID(user.UserID);
    return res.render('assess/index', {
        userOnPanels
    })
}

//Overview
exports.g_overview = async function (req, res) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);

        if (assessment.Status === 'Published') {
            return res.redirect('/reports/report/' + assessment.AssessmentID)
        }

        return res.render('assess/entry/overview', { assessment });
    }
    catch (error) {
        next(error)
    }
}

exports.g_report = async function (req, res) {
    try {
        const user = req.session.data.User;
        const assessmentID = req.params.assessmentID;
        const assessment = await getAssessmentById(assessmentID);

        if (assessment.Status === 'Published') {
            return res.redirect('/reports/report/' + assessment.AssessmentID)
        }


        if (assessment.Type == 'Service assessment') {

            const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
            const serviceStandards = await getServiceStandards();
            const actions = await getActionsForAssessmentID(assessmentID);
            const panel = await assessmentPanel(assessmentID);
            const submitStatus = await checkSubmitStatus(assessmentID)
            const canSubmitReport = await canSubmit(assessmentID, user.UserID);

            return res.render('assess/entry/report', {
                assessment, ratings, panel,
                serviceStandards, actions, submitStatus, canSubmitReport
            })
        }
        else {

            return res.render('assess/entry/pr-report', {
                assessment

            })
        }
    }
    catch (error) {
        next(error)
    }

}


exports.g_panel = async function (req, res) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const panel = await assessmentPanelExtended(assessmentID);
        return res.render('assess/entry/panel', { assessment, panel });
    }
    catch (error) {
        next(error)
    }
}


exports.g_artefacts = async function (req, res) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const artefacts = await getArtefactsForAssessment(assessmentID);
        return res.render('assess/entry/artefacts', { assessment, artefacts });
    }
    catch (error) {
        next(error)
    }
}


exports.g_team = async function (req, res) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const team = await getTeamForAssessmentExtended(assessmentID);
        return res.render('assess/entry/team', { assessment, team });
    }
    catch (error) {
        next(error)
    }
}

exports.g_reportRating = async function (req, res) {
    try {

        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
        const serviceStandards = await getServiceStandards();
        const actions = await getActionsForAssessmentID(assessmentID);
        return res.render('assess/entry/report-rating', {
            assessment, ratings, serviceStandards, actions
        })
    }
    catch (error) {
        next(error)
    }

}

exports.g_reportPanelComments = async function (req, res) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render('assess/entry/report-panel-comments', { assessment });
    }
    catch (error) {
        next(error)
    }
}

exports.g_reportSection = async function (req, res) {
    try {
        const { assessmentID, standard } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
        const serviceStandards = await getServiceStandards();
        const actions = await getActionsForAssessmentID(assessmentID);
        return res.render('assess/entry/report-section', {
            assessment, ratings, serviceStandards, actions, standard
        })
    }
    catch (error) {
        next(error)
    }
}


exports.g_reportSectionActions = async function (req, res) {
    try {
        const { assessmentID, standard } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
        const serviceStandards = await getServiceStandards();
        const actions = await getActionsForAssessmentIDAndStandard(assessmentID, standard);
        return res.render('assess/entry/report-section-actions', {
            assessment, ratings, serviceStandards, actions, standard
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_reportSectionActionsAdd = async function (req, res) {
    try {
        const { assessmentID, standard } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
        const serviceStandards = await getServiceStandards();
        const actions = await getActionsForAssessmentID(assessmentID);
        return res.render('assess/entry/report-section-actions-add', {
            assessment, ratings, serviceStandards, actions, standard
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_reportSectionActionsManage = async function (req, res) {
    try {
        const { assessmentID, standard, uniqueID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
        const serviceStandards = await getServiceStandards();
        const action = await getActionByUniqueID(uniqueID);

        return res.render('assess/entry/report-section-actions-manage', {
            assessment, ratings, serviceStandards, action, standard
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_volunteer = async function (req, res) {
    try {
        const department = req.session.data.User.Department;
        const statuses = ['Active'];
        const assessments = await getRequestsByMixedStatus(statuses, department);

        // Get assessment panels for each assessment
        // add to a new array of assessmentPanels to pass to the view
        const assessmentPanels = [];
        for (let i = 0; i < assessments.length; i++) {
            const assessment = assessments[i];
            const assessmentID = assessment.AssessmentID;
            // Renamed variable to avoid naming conflict
            const panel = await assessmentPanelExtended(assessmentID);
            assessmentPanels.push(panel[0]);
        }

        return res.render('assess/volunteer', {
            assessments: assessments,
            assessmentPanels: assessmentPanels
        });
    }
    catch (error) {
        next(error)
    }
};

exports.g_data = async function (req, res) {
    try {
        const assessmentID = req.params.id;

        const assessment = await getAssessmentById(assessmentID);

        // Prepare a response object
        const responseData = {
            assessment: assessment
        };

        res.json(responseData);

    } catch (error) {
        next(error)
    }
}


exports.g_volunteerA = async function (req, res) {
    try {
        const assessmentID = req.params.id;
        const role = req.params.role;

        const assessment = await getAssessmentById(assessmentID);

        return res.render('assess/volunteerAssess', {
            assessment, role
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_detail = async function (req, res) {
    try {
        const assessmentID = req.params.id;

        const assessment = await getAssessmentById(assessmentID);
        const panelDetails = await assessmentPanelExtended(assessmentID);

        return res.render('assess/detail', {
            assessment: assessment,
            assessmentPanel: panelDetails
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_submitted = async function (req, res) {
    try {
        const assessmentID = req.params.id;

        const assessment = await getAssessmentById(assessmentID);

        return res.render('assess/submitted', {
            assessment: assessment
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_previous = async function (req, res) {
    try {
        const user = req.session.data.User;
        const userOnPanels = await getAssessmentPanelByUserID(user.UserID);
        return res.render('assess/previous', {
            userOnPanels
        })
    }
    catch (error) {
        next(error)
    }
}


// POSTS //

exports.p_volunteer = async function (req, res) {
    try {

        const { assessmentID, role } = req.body;
        const user = req.session.data.User;
        const assessment = await getAssessmentById(assessmentID);

        // Send email to SA+ team

        const templateParamsSA = {
            FirstName: user.FirstName,
            LastName: user.LastName,
            Email: user.EmailAddress,
            ServiceName: assessment.Name,
            Role: role.toLowerCase(),
            ServiceURL: process.env.serviceURL,
            ID: assessmentID
        };

        sendNotifyEmail(process.env.email_Volunteer_SA, process.env.saPlusEmail, templateParamsSA);

        const templateParamsUser = {
            ServiceName: assessment.Name,
            Role: role.toLowerCase()
        };

        // Send email to volunteer
        sendNotifyEmail(process.env.email_Volunteer_User, user.EmailAddress, templateParamsUser);


        return res.redirect('/volunteer/submitted/' + assessmentID);
    }
    catch (error) {
        next(error)
    }

}






// POSTS

exports.p_reportSection = [
    validateAddRating,
    async (req, res) => {
        try {
            const errors = validationResult(req);

            const { AssessmentID, Standard } = req.body;
            const user = req.session.data.User;

            if (!errors.isEmpty()) {

                const assessment = await getAssessmentById(AssessmentID);
                const serviceStandards = await getServiceStandards();

                return res.render('assess/entry/report-section', {
                    assessment, serviceStandards, standard: Standard,
                    errors: errors.array()
                });
            }

            const { outcomerag } = req.body;

            const result = await updateServiceStandardOutcome(AssessmentID,
                Standard,
                outcomerag,
                user.UserID
            )

            if (outcomerag === 'Green' || outcomerag === 'NA') {
                return res.redirect('/assess/report/' + AssessmentID)
            } else {
                return res.redirect('/assess/report-section-actions/' + AssessmentID + '/' + Standard)
            }

        }
        catch (error) {
            next(error)
        }
    }
]



/** 
 * Add an action to the list for a given assessment and standard
 * @param {number} assessmentID The unique identifier of the assessment.
 * @param {number} standard The standard of the assessment.
 */
exports.p_reportSectionActionsAdd = [
    validateAddAction,
    async (req, res) => {
        try {
            const { AssessmentID, Standard, actionPlanItem } = req.body;
            const user = req.session.data.User;

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                const assessment = await getAssessmentById(AssessmentID);
                const serviceStandards = await getServiceStandards();
                const actions = await getActionsForAssessmentID(AssessmentID);

                return res.render('assess/entry/report-section-actions-add', {
                    assessment, serviceStandards, actions, standard: Standard,
                    errors: errors.array()
                });
            }


            await addAction(AssessmentID, Standard, actionPlanItem, user.UserID);

            return res.redirect('/assess/report-section-actions/' + AssessmentID + '/' + Standard);

        }
        catch (error) {
            next(error)
        }
    }
]


/**
 * Update an action for a given UniqueID
 * @param {uuid} uniqueID The unique identifier of the action.
 */
exports.p_reportSectionActionsManage = [
    validateAddAction,
    async (req, res) => {
        try {
            const { AssessmentID, Standard, UniqueID, action, actionPlanItem } = req.body;
            const user = req.session.data.User;

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                const assessment = await getAssessmentById(AssessmentID);
                const serviceStandards = await getServiceStandards();
                const actions = await getActionsForAssessmentID(AssessmentID);

                return res.render('assess/entry/report-section-actions-manage', {
                    assessment, serviceStandards, actions, standard: Standard,
                    errors: errors.array()
                });
            }

            if (action === 'save') {
                await updateAction(UniqueID, actionPlanItem);
            } else if (action === 'delete') {
                await deleteAction(UniqueID);
            }

            return res.redirect('/assess/report-section-actions/' + AssessmentID + '/' + Standard);

        }
        catch (error) {
            next(error)
        }
    }
]

/**
 * Update panel comments for the report
 * The good comments
 */
exports.p_reportPanelComments = [
    validateAddComments,
    async (req, res) => {
        try {
            const { AssessmentID, PanelComments } = req.body;

            const assessment = await getAssessmentById(AssessmentID);

            assessment.PanelComments = PanelComments;
            assessment.PanelCommentsComplete = true;

            await updateAssessment(AssessmentID, assessment, req.session.data.User.UserID);

            return res.redirect('/assess/report/' + AssessmentID);

        }
        catch (error) {
            next(error)
        }
    }
]


exports.p_submitReport = async function (req, res) {
    try {
        const { AssessmentID } = req.body;
        const assessment = await getAssessmentById(AssessmentID);

        const outcomes = await getServiceStandardOutcomesByAssessmentID(AssessmentID);

        let outcome = "Green";

        //  If there is a single red outcome, the overall outcome is red
        // If no red, and a single amber, the overall outcome is amber
        // Otherwise it stays green

        for (let i = 0; i < outcomes.length; i++) {
            if (outcomes[i].Outcome === "Red") {
                outcome = "Red";
                break;
            }
            if (outcomes[i].Outcome === "Amber") {
                outcome = "Amber";
            }
        }


        const userID = req.session.data.User.UserID;
        const now = new Date();

        assessment.Status = "SA Review";
        assessment.SubmittedBy = userID
        assessment.SubmittedDate = now;
        assessment.Outcome = outcome;

        await updateAssessment(AssessmentID, assessment, req.session.data.User.UserID);

        // ToDo: Send email to SA team

        return res.redirect('/assess/overview/' + AssessmentID);

    }
    catch (error) {
        next(error)
    }
}


exports.p_submitPRReport = async function (req, res) {
    try {
        const { AssessmentID, PanelComments, PanelCommentsImprove } = req.body;
        const assessment = await getAssessmentById(AssessmentID);

        const userID = req.session.data.User.UserID;
        const now = new Date();

        // If button value 'action' is save, save the action
        if (req.body.action === 'save') {
            assessment.PanelComments = PanelComments;
            assessment.PanelCommentsComplete = true;
            assessment.PanelCommentsImprove = PanelCommentsImprove;
        }


        if (req.body.action === 'submit') {
            assessment.Status = "SA Review";
            assessment.SubmittedBy = userID
            assessment.SubmittedDate = now;
            assessment.PanelComments = PanelComments;
            assessment.PanelCommentsComplete = true;
            assessment.PanelCommentsImprove = PanelCommentsImprove;
        }

        await updateAssessment(AssessmentID, assessment, req.session.data.User.UserID);

        // ToDo: Send email to SA team

        return res.redirect('/assess/overview/' + AssessmentID);

    }
    catch (error) {
        next(error)
    }
}

