const { check, validationResult } = require('express-validator');
const { AssessmentModel, createAssessment, getAssessmentById, updateAssessment, getDraftsForUser, deleteAssessment, getRequestsByStatus, getRequestsByMixedStatus } = require('../models/assessmentModel');
const { assessmentPanel, assessmentPanelExtended, getActiveAssessors, addPanelMember, findAssessmentPanelByIdAndUniqueID, deleteAssessmentPanelMember } = require('../models/assessmentPanel');
const { getAllAssessors, createAssessor } = require('../models/assessors');
const { validateRequest, validateAddPanel } = require('../validation/admin');
const { UpsertUserNoToken, getBasicUserDetails } = require('../models/user');
const { getServiceStandards, getServiceStandardOutcomesByAssessmentID } = require('../models/standards');
const { getActionsForAssessmentID } = require('../models/actions');
const { getArtefactsForAssessment } = require('../models/artefacts');
const { getTeamForAssessmentExtended } = require('../models/team');
const { sendNotifyEmail } = require('../middleware/notify');

exports.g_index = async function (req, res) {
    const department = req.session.data.User.Department;
    const statuses = ['New', 'SA Review', 'SA Publish'];
    const requests = await getRequestsByMixedStatus(statuses, department);
    return res.render('admin/index', { requests });
}

exports.g_overview = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    const panel = await assessmentPanel(assessmentID);
    return res.render('admin/entry/overview', { assessment, panel });
}

exports.g_process = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    return res.render('admin/entry/request', { assessment });
}

exports.g_panel = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    const panel = await assessmentPanelExtended(assessmentID);
    return res.render('admin/entry/panel', { assessment, panel });
}

exports.g_addpanel = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    const assessors = await getActiveAssessors();

    return res.render('admin/entry/add-panel', { assessment, assessors });
}

exports.g_removepanel = async function (req, res) {
    const { assessmentPanelID, uniqueID } = req.params;
    const assessor = await findAssessmentPanelByIdAndUniqueID(assessmentPanelID, uniqueID);
    console.log(assessor);
    const assessment = await getAssessmentById(assessor.AssessmentID);
    return res.render('admin/entry/remove-panel', { assessment, assessor });
}


exports.g_adddate = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    return res.render('admin/entry/add-date', { assessment });
}


exports.g_assessments = async function (req, res) {
    const department = req.session.data.User.Department;
    const statuses = ['Active', 'Team Review', 'SA Review', 'SA Publish'];
    const active = await getRequestsByMixedStatus(statuses, department);
    return res.render('admin/assessments', { assessments: active });
};

exports.g_assessors = async function (req, res) {
    const department = req.session.data.User.Department;
    const assessors = await getAllAssessors(department);
    console.log(assessors)

    return res.render('admin/assessors', { assessors });
};

exports.g_addassessor = async function (req, res) {
    return res.render('admin/add-assessor');
};

exports.g_report = async function (req, res) {

    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
    const serviceStandards = await getServiceStandards();
    const actions = await getActionsForAssessmentID(assessmentID);
    return res.render('admin/entry/report', {
        assessment, ratings, serviceStandards, actions
    })
}


exports.g_artefacts = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    const artefacts = await getArtefactsForAssessment(assessmentID);
    return res.render('admin/entry/artefacts', { assessment, artefacts });
}


exports.g_team = async function (req, res) {
    const { assessmentID } = req.params;
    const assessment = await getAssessmentById(assessmentID);
    const team = await getTeamForAssessmentExtended(assessmentID);
    return res.render('admin/entry/team', { assessment, team });
}



// POSTS

exports.p_process = [
    validateRequest,
    async (req, res) => {
        const { assessmentID, process } = req.body;
        const userID = req.session.data.User.UserID;

        var assessment = await getAssessmentById(assessmentID);

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('admin/entry/request', {
                assessment,
                errors: errors.array()
            });
        }

        const newStatus = process == 'Accept' ? 'Active' : 'Rejected'
        assessment.Status = newStatus;

        await updateAssessment(assessmentID, assessment, userID);

        return res.redirect(`/admin/overview/${assessmentID}`);
    }
];

exports.p_addpanel = [
    validateAddPanel,
    async (req, res) => {

        const { AssessmentID, Assessor, Role } = req.body;

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            const assessment = await getAssessmentById(AssessmentID);
            const assessors = await getActiveAssessors();

            return res.render('admin/entry/add-panel', {
                assessment, assessors,
                errors: errors.array()
            });
        }

        const panel = addPanelMember(AssessmentID, Assessor, Role);

        //TODO: send email to the added panel member

        return res.redirect(`/admin/panel/${AssessmentID}`);
    }
];

exports.p_removepanel = async function (req, res) {
    const { AssessmentPanelID, UniqueID, AssessmentID } = req.body;
    await deleteAssessmentPanelMember(UniqueID);
    return res.redirect(`/admin/panel/${AssessmentID}`);

}


exports.p_adddate = async function (req, res) {
    const userID = req.session.data.User.UserID;
    const { AssessmentID, AssessmentDate_day, AssessmentDate_month, AssessmentDate_year, AssessmentTime, CustomTime } = req.body;

    const assessment = await getAssessmentById(AssessmentID);

    const day = parseInt(AssessmentDate_day, 10);
    const month = parseInt(AssessmentDate_month, 10) - 1; // months are 0-indexed in JS
    const year = parseInt(AssessmentDate_year, 10);

    const assessmentDate = new Date(Date.UTC(year, month, day));
    assessment.AssessmentDateTime = assessmentDate.toISOString();
    assessment.AssessmentTime = CustomTime;

    await updateAssessment(AssessmentID, assessment, userID);

    return res.redirect(`/admin/overview/${AssessmentID}`);
};

exports.p_addassessor = async function (req, res) {

    const user = req.session.data.User;


    const { FirstName, LastName, crossGovAssessor, leadAssessor, externalAssessor, Role } = req.body;
    let { EmailAddress } = req.body;

    // Validate we have all the data we need
    const validationErrors = [];

    if (!FirstName) {
        validationErrors.push({ field: 'FirstName', message: 'Enter a first name' })
    }

    if (!LastName) {
        validationErrors.push({ field: 'LastName', message: 'Enter a last name' })
    }

    if (!EmailAddress) {
        validationErrors.push({ field: 'EmailAddress', message: 'Enter a valid email address' })
    }


    if (!Role) {
        validationErrors.push({ field: 'Role', message: 'Select a role' })
    }


    if (!crossGovAssessor) {
        validationErrors.push({ field: 'crossGovAssessor', message: 'Select if the person is a cross gov assessor or not' })
    }

    if (!leadAssessor) {
        validationErrors.push({ field: 'leadAssessor', message: 'Select if the person is a lead assessor or not' })
    }

    if (!externalAssessor) {
        validationErrors.push({ field: 'externalAssessor', message: 'Select if the assessor is external to the department' })
    }

    console.log(validationErrors)

    if (validationErrors.length > 0) {
        return res.render('admin/add-assessor', { errors: validationErrors });
    }

    // good to continue

    // Add user

    console.log('add user')
    const userx = await UpsertUserNoToken(EmailAddress, FirstName, LastName, user.UserID, 'Create assessor');
    console.log(userx)

    if (userx) {

        const xgov = crossGovAssessor === 'Yes' ? 1 : 0;
        const lead = leadAssessor === 'Yes' ? 1 : 0;
        const external = externalAssessor === 'Yes' ? 1 : 0;

        const assessor = await createAssessor(userx, Role, xgov, lead, external);

        // Clear the request body
        req.session.data.FirstName = '';
        req.session.data.LastName = '';
        req.session.data.crossGovAssessor = '';
        req.session.data.leadAssessor = '';
        req.session.data.externalAssessor = '';
        req.session.data.Role = '';
        req.session.data.EmailAddress = '';


    }


    return res.redirect('/admin/assessors')
};




exports.p_sendReport = async function (req, res) {

    const { AssessmentID } = req.body;

    const assessment = await getAssessmentById(AssessmentID);

    console.log(assessment)

    const userID = req.session.data.User.UserID;

    const submittor = await getBasicUserDetails(assessment.CreatedBy);

    const dm = await getBasicUserDetails(assessment.DM);

    console.log(submittor)

    assessment.Status = 'Team Review';

    await updateAssessment(AssessmentID, assessment, userID);

    // Send email 

    const templateParams = {
        phase: assessment.Phase,
        type: assessment.Type,
        name: assessment.Name,
        serviceURL: process.env.serviceURL,
        id: AssessmentID
    };

    sendNotifyEmail(process.env.email_ReportReady, submittor.EmailAddress, templateParams)


    if (assessment.PM) {
        const pm = await getBasicUserDetails(assessment.PM);
        if (pm.EmailAddress) {
            sendNotifyEmail(process.env.email_ReportReady, pm.EmailAddress, templateParams)
        }
    }

    if (assessment.DM) {
        const dm = await getBasicUserDetails(assessment.DM);
        if (dm.EmailAddress) {
            sendNotifyEmail(process.env.email_ReportReady, dm.EmailAddress, templateParams)
        }
    }

    return res.redirect('/admin/report/' + AssessmentID)
}


exports.p_publishReport = async function (req, res) {

    const { AssessmentID } = req.body;
    const user = req.session.data.User;

    const assessment = await getAssessmentById(AssessmentID);
    assessment.Status = 'Published'

    await updateAssessment(AssessmentID, assessment, user.UserID);

    return res.redirect('/admin/report/' + AssessmentID);


};
