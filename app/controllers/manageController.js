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
const { check, validationResult } = require('express-validator');
const { getAssessmentsUserCanAccess, getAssessmentById, updateAssessment } = require('../models/assessmentModel');
const { assessmentPanel, assessmentPanelExtended, getActiveAssessors, addPanelMember, findAssessmentPanelByIdAndUniqueID, deleteAssessmentPanelMember } = require('../models/assessmentPanel');
const { UpsertUserNoToken, getBasicUserDetails } = require('../models/user');
const { getServiceStandards, getServiceStandardOutcomesByAssessmentID } = require('../models/standards');
const { getActionsForAssessmentID } = require('../models/actions');
const { getArtefactsForAssessment, addArtefact, getArtefactByIdAndUniqueID, deleteArtefact } = require('../models/artefacts');
const { getTeamForAssessmentExtended, addTeam, getTeamMemberForIdAndUniqueID, deleteTeamMemberByID } = require('../models/team');
const { validateAddArtefact, validateAddTeam } = require('../validation/manage');
const { addAuditEntry } = require('../models/audit');
const { sendNotifyEmail } = require('../middleware/notify');

const { postArtefactMessage } = require('../models/slack');

exports.g_manage = async (req, res, next) => {
    try {
        const user = req.session.data.User;
        const assessments = await getAssessmentsUserCanAccess(user.UserID);

        // Filter them where the status is not Published
        const filteredAssessments = assessments.filter(assessment => assessment.Status !== 'Published')

        res.render('manage/index', { assessments: filteredAssessments })
    } catch (error) {
        next(error)
    }
}

exports.g_previous = async (req, res, next) => {
    try {
        const user = req.session.data.User;
        const assessments = await getAssessmentsUserCanAccess(user.UserID);

        // Filter them where the status is Published
        const filteredAssessments = assessments.filter(assessment => assessment.Status === 'Published')

        res.render('manage/previous', { assessments: filteredAssessments })
    } catch (error) {
        next(error)
    }
}

exports.g_overview = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const team = await getTeamForAssessmentExtended(assessmentID);
        const artefacts = await getArtefactsForAssessment(assessmentID);
        return res.render('manage/entry/overview', { assessment, artefacts, team });
    } catch (error) {
        next(error)
    }
}

exports.g_panel = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const panel = await assessmentPanelExtended(assessmentID);
        return res.render('manage/entry/panel', { assessment, panel });
    } catch (error) {
        next(error)
    }
}

exports.g_request = async function (req, res, next) {
    try {
        const assessmentID = req.params.assessmentID;
        const assessment = await getAssessmentById(assessmentID);
        let { ddDetails, pmDetails, dmDetails } = "";

        if (assessment.DD) {
            // Get basic user details
            ddDetails = await getBasicUserDetails(assessment.DD);
        }

        if (assessment.PM) {
            pmDetails = await getBasicUserDetails(assessment.PM);
        }

        if (assessment.DM) {
            dmDetails = await getBasicUserDetails(assessment.DM);
        }
        return res.render('manage/entry/request', {
            assessment, ddDetails, pmDetails, dmDetails
        })
    } catch (error) {
        next(error)
    }
}

exports.g_report = async function (req, res, next) {
    try {
        const user = req.session.data.userDetails;
        const assessmentID = req.params.assessmentID;
        const assessment = await getAssessmentById(assessmentID);

        if (assessment.Status == 'Team Review' || assessment.Status == 'SA Publish' || assessment.Status == 'Published') {
            const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
            const serviceStandards = await getServiceStandards();
            const actions = await getActionsForAssessmentID(assessmentID);

            return res.render('manage/entry/report-complete', {
                assessment, ratings, serviceStandards, actions
            })
        }

        return res.render('manage/entry/report', {
            assessment
        })
    } catch (error) {
        next(error)
    }


}


exports.g_artefacts = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const artefacts = await getArtefactsForAssessment(assessmentID);
        return res.render('manage/entry/artefacts', { assessment, artefacts });
    } catch (error) {
        next(error)
    }
}


exports.g_team = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const team = await getTeamForAssessmentExtended(assessmentID);
        return res.render('manage/entry/team', { assessment, team });
    } catch (error) {
        next(error)
    }
}

exports.g_addteam = async function (req, res, next) {
    try {
        const assessmentID = req.params.assessmentID;
        const assessment = await getAssessmentById(assessmentID);
        return res.render('manage/entry/add-team', {
            assessment
        })
    } catch (error) {
        next(error)
    }
}

exports.g_addartefact = async function (req, res, next) {
    try {
        const assessmentID = req.params.assessmentID;
        const assessment = await getAssessmentById(assessmentID);
        return res.render('manage/entry/add-artefact', {
            assessment
        })
    } catch (error) {
        next(error)
    }
}



exports.g_removeartefact = async function (req, res, next) {
    try {
        const { artefactID, uniqueID } = req.params;
        const artefact = await getArtefactByIdAndUniqueID(artefactID, uniqueID);

        const assessment = await getAssessmentById(artefact.AssessmentID);
        return res.render('manage/entry/remove-artefact', { assessment, artefact });
    } catch (error) {
        next(error)
    }
}

exports.g_removeteam = async function (req, res, next) {
    try {
        const { teamID, uniqueID } = req.params;

        const team = await getTeamMemberForIdAndUniqueID(teamID, uniqueID);

        const assessment = await getAssessmentById(team.AssessmentID);
        return res.render('manage/entry/remove-team', { assessment, team });
    } catch (error) {
        next(error)
    }
}



// POSTS

exports.p_addartefact = [
    validateAddArtefact,
    async (req, res, next) => {
        try {
            const { Title, Description, URL, AssessmentID } = req.body;

            var assessment = await getAssessmentById(AssessmentID);

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('manage/entry/add-artefact', {
                    assessment,
                    errors: errors.array()
                });
            }

            await addArtefact(AssessmentID, Title, Description, URL, req.session.data.User.UserID);

            await postArtefactMessage(assessment.SlackID, Title, AssessmentID);
            
            // Clear the body and data for the fields
            req.body = {};
            req.session.data.Title = '';
            req.session.data.Description = '';
            req.session.data.URL = '';


            return res.redirect(`/manage/artefacts/${AssessmentID}`);
        } catch (error) {
            next(error)
        }
    }
];


exports.p_removeartefact = async function (req, res, next) {

    try {
        const { ArtefactID, UniqueID } = req.body;

        // ToDo: Validate the deletion request, can the user actually delete the request?

        // If artefact isn't a number, redirect to the artefacts page
        if (isNaN(ArtefactID)) {
            return res.redirect('/manage');
        }

        const artefact = await getArtefactByIdAndUniqueID(ArtefactID, UniqueID);

        if (artefact !== null) {
            await deleteArtefact(ArtefactID);
            return res.redirect(`/manage/artefacts/${artefact.AssessmentID}`);
        }

        return res.redirect('/manage');
    } catch (error) {
        next(error)
    }
};


exports.p_addteam = [
    validateAddTeam,
    async (req, res, next) => {
        try {
            const { EmailAddress, FirstName, LastName, Role, AssessmentID } = req.body;

            var assessment = await getAssessmentById(AssessmentID);

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('manage/entry/add-team', {
                    assessment,
                    errors: errors.array()
                });
            }

            let emailAddress = EmailAddress.toLowerCase();

            let userID = await UpsertUserNoToken(emailAddress, FirstName, LastName, req.session.data.User.UserID, 'Add team member request: ' + AssessmentID);

            await addTeam(AssessmentID, userID, Role);

            // Clear the body and data for the fields
            req.body = {};
            req.session.data.EmailAddress = '';
            req.session.data.FirstName = '';
            req.session.data.LastName = '';
            req.session.data.Role = '';

            // Send email to the added team member

            const templateParams = {
                phase: assessment.Phase.toLowerCase(),
                type: assessment.Type.toLowerCase(),
                name: assessment.Name,
                summary: assessment.Description,
                serviceURL: process.env.serviceURL,
                id: assessment.AssessmentID.toString()
            };
    
            // Send email to user
            sendNotifyEmail(process.env.email_AddedToTeam, emailAddress, templateParams);


            return res.redirect(`/manage/team/${AssessmentID}`);
        } catch (error) {
            next(error)
        }
    }
];


exports.p_removeteam = async function (req, res, next) {
    try {
        const { ID, UniqueID } = req.body;



        const team = await getTeamMemberForIdAndUniqueID(ID, UniqueID);

        if (team !== null) {
            await deleteTeamMemberByID(team.ID);
            return res.redirect(`/manage/team/${team.AssessmentID}`);
        }

        return res.redirect('/manage');
    } catch (error) {
        next(error)
    }
};


exports.p_acceptReport = async function (req, res, next) {
    try {

        const { AssessmentID } = req.body;
        const user = req.session.data.User;
        const assessment = await getAssessmentById(AssessmentID);
        assessment.Status = 'SA Publish'

        await updateAssessment(AssessmentID, assessment, user.UserID);
        await addAuditEntry(AssessmentID, "Report accepted", "Team accepted the report", req.session.data.User.UserID);

        return res.redirect('/manage/report/' + AssessmentID);
    } catch (error) {
        next(error)
    }
};

