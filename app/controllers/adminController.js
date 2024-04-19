const { check, validationResult } = require('express-validator');
const { AssessmentModel, createAssessment, getAssessmentById, updateAssessment, getDraftsForUser, deleteAssessment, getRequestsByStatus, getRequestsByMixedStatus, getActiveAssessmentsWithAssessorData, getAssessmentPanelByUserID, changePrimaryContact, getAllAssessments } = require('../models/assessmentModel');
const { assessmentPanel, assessmentPanelExtended, getActiveAssessors, addPanelMember, findAssessmentPanelByIdAndUniqueID, deleteAssessmentPanelMember } = require('../models/assessmentPanel');
const { getAllAssessors, createAssessor, getAssessor, getTrainingForUser, createTraining, getTrainingByUniqueID, getAssessorByUserID, deleteTraining, updateAssessor } = require('../models/assessors');
const { validateRequest, validateAddPanel, validateAddAdmin, validateAddTraining } = require('../validation/admin');
const { UpsertUserNoToken, getBasicUserDetails, getBasicUserDetailsByEmail } = require('../models/user');
const { getAllAdmins, addAdmin, getAdminByRoleID, deleteAdmin } = require('../models/userrole');
const { getServiceStandards, getServiceStandardOutcomesByAssessmentID } = require('../models/standards');
const { getActionsForAssessmentID } = require('../models/actions');
const { getArtefactsForAssessment } = require('../models/artefacts');
const { getTeamForAssessmentExtended } = require('../models/team');
const { sendNotifyEmail } = require('../middleware/notify');
const { getDepartments } = require('../models/departments');

const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ExcelJS = require('exceljs');


exports.g_index = async function (req, res) {
    try {
        const department = req.session.data.User.Department;
        const requests = await getAllAssessments(department);
        const filter = req.params.filter || 'priority'; 

   
        const filterDefinitions = {
            'priority': {
                conditions: ['New', 'Team Review', 'SA Review', 'SA Publish'],
                view: 'Priority tasks'
            },
            'sa-review': {
                conditions: ['SA Review'],
                view: 'Reports to send on to the team'
            },
            'sa-publish': {
                conditions: ['SA Publish'],
                view: 'Reports needing to be published'
            },
            'team-review': {
                conditions: ['Team Review'],
                view: 'Reports with the team to review'
            },
            'no-date': {
                conditionFunc: request => request.Status === 'Active' && !request.AssessmentDateTime,
                view: 'Requests with no assessment date set'
            }
        };

        // Filter requests based on selected filter and condition
        const { conditions, conditionFunc, view } = filterDefinitions[filter];
        let filteredData = conditions ? requests.filter(request => conditions.includes(request.Status)) : requests.filter(conditionFunc);

        // Render page with filtered data
        res.render('admin/index', {
            filteredData,
            filter,
            filterView: view,
            ...Object.fromEntries(Object.keys(filterDefinitions).map(key => [key, requests.filter(filterDefinitions[key].conditionFunc || ((req) => filterDefinitions[key].conditions.includes(req.Status)))]))
        });
    } catch (error) {
        console.error('Failed to fetch or filter data:', error);
        res.render('admin/index', { error: 'Failed to fetch or filter data' });
    }
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

    const primaryContact = await getBasicUserDetails(assessment.CreatedBy);
    const pmDetails = await getBasicUserDetails(assessment.PM);
    const dmDetails = await getBasicUserDetails(assessment.DM);
    const ddDetails = await getBasicUserDetails(assessment.DD);
    const primaryContactEmail = primaryContact.EmailAddress;

    return res.render('admin/entry/request', { assessment, primaryContactEmail, pmDetails, dmDetails, ddDetails });
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
    return res.render('admin/assessors', { assessors });
};

exports.g_assessor = async function (req, res) {
    const { assessorID } = req.params;
    const assessor = await getAssessor(assessorID);
    const training = await getTrainingForUser(assessor.UserID);

    return res.render('admin/assessor', { assessor, training });

}

exports.g_changeAssessorStatus = async function (req, res) {
    const { assessorID } = req.params;
    const assessor = await getAssessor(assessorID);
    const training = await getTrainingForUser(assessor.UserID);

    return res.render('admin/change-assessor-status', { assessor, training });
}



exports.g_admins = async function (req, res) {
    const department = req.session.data.User.Department;

    const admins = await getAllAdmins(department);
    return res.render('admin/admins', { admins });
};

exports.g_removeadmin = async function (req, res) {
    const department = req.session.data.User.Department;
    const { userRoleID } = req.params;
    const admin = await getAdminByRoleID(department, userRoleID);
    return res.render('admin/remove-admin', { admin });
};

exports.g_addassessor = async function (req, res) {
    const departments = await getDepartments();
    return res.render('admin/add-assessor', { departments });
};

exports.g_assessmentHistory = async function (req, res) {
    const { assessorID } = req.params;
    const assessor = await getAssessor(assessorID);
    const assessments = await getAssessmentPanelByUserID(assessor.UserID);

    return res.render('admin/assessment-history', { assessor, assessments });
};

exports.g_addadmin = async function (req, res) {
    return res.render('admin/add-admin');
};

exports.g_addtraining = async function (req, res) {
    const { assessorID } = req.params;
    return res.render('admin/add-training', { assessorID });
};

exports.g_removetraining = async function (req, res) {
    const { trainingUniqueID } = req.params;

    const training = await getTrainingByUniqueID(trainingUniqueID);
    const assessor = await getAssessorByUserID(training.UserID);
    console.log(assessor)

    return res.render('admin/remove-training', { training, assessor });
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

exports.g_reporting = async function (req, res) {

    return res.render('admin/reporting/index');
}

exports.g_reportingAssessmentsAndPanels = async function (req, res) {

    const department = req.session.data.User.Department;
    const assessments = await getActiveAssessmentsWithAssessorData(department);

    return res.render('admin/reporting/assessments', {
        assessments: assessments
    });
}


exports.g_exportAssessmentReport = async function (req, res) {
    const department = req.session.data.User.Department;
    // Assuming getActiveAssessmentsWithAssessorData returns data in the structure matching the HTML table
    const assessments = await getActiveAssessmentsWithAssessorData(department);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assessments');

    // Define columns based on your HTML table headers
    worksheet.columns = [
        { header: 'Service', key: 'service', width: 25 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Phase', key: 'phase', width: 15 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 15 },
        { header: 'Lead', key: 'lead', width: 20 },
        { header: 'Design', key: 'design', width: 20 },
        { header: 'UR', key: 'ur', width: 20 },
        { header: 'Tech', key: 'tech', width: 20 },
        { header: 'Performance', key: 'performance', width: 20 },
    ];

    // Add rows for each assessment
    assessments.forEach(assessment => {
        // Add a row for each assessment
        const row = worksheet.addRow({
            service: {
                text: assessment.Name,
                hyperlink: `https://localhost:3000/volunteer/detail/${assessment.AssessmentID}`
            },
            description: assessment.Description,
            phase: assessment.Phase,
            type: assessment.Type,
            date: assessment.AssessmentDateTime,
            time: assessment.AssessmentTime,
            lead: assessment.Lead || '-', // Assuming you might have empty values
            design: assessment.Design || '-',
            ur: assessment.UR || '-',
            tech: assessment.Tech || '-',
            performance: assessment.Performance || '-',
        });


        // Optional: Set style for hyperlink (blue color & underlined text)
        row.getCell('service').style = {
            font: { color: { argb: 'FF0000FF' }, underline: true }
        };
    });

    // Generate filename based on department and current timestamp for uniqueness
    const filename = `assessments_report_${Date.now()}.xlsx`;

    // Set response headers to prompt download with the generated filename
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Write the workbook to a buffer and send as response
    workbook.xlsx.writeBuffer().then(buffer => {
        res.send(buffer);
    }).catch(error => {
        console.error('Error writing Excel to buffer', error);
        res.status(500).send('Error generating Excel file');
    });
};



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

    // Figure out the department from the email address, and check against the departments domain
    const emailParts = EmailAddress.split('@');
    const domain = emailParts[1];
    const departments = await getDepartments();
    let department = departments.find(d => d.Domain === domain);

    if (department === undefined) {
        department = 0
    }
    else {
        department = department.DepartmentID;
    }


    console.log('add user')
    const userx = await UpsertUserNoToken(EmailAddress, FirstName, LastName, user.UserID, 'Create assessor', department);
    console.log(userx)

    if (userx) {

        const xgov = crossGovAssessor === 'Yes' ? 1 : 0;
        const lead = leadAssessor === 'Yes' ? 1 : 0;
        const external = externalAssessor === 'Yes' ? 1 : 0;

        const assessor = await createAssessor(userx, Role, xgov, lead, external, user.Department);

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



exports.p_addadmin = [
    validateAddAdmin,
    async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return res.render('admin/entry/add-admin', {
                assessment, assessors,
                errors: errors.array()
            });
        }

        const user = req.session.data.User;
        const department = req.session.data.User.Department;

        const { FirstName, LastName, EmailAddress, createAsLead } = req.body;

        const admin = addAdmin(FirstName, LastName, EmailAddress, department, createAsLead, user.UserID);


        return res.redirect(`/admin/admins`);
    }
];

exports.p_removeadmin = async function (req, res) {

    const { userRoleID } = req.body;
    const userID = req.session.data.User.UserID;

    const department = req.session.data.User.Department;
    await deleteAdmin(userRoleID, department, userID)

    return res.redirect(`/admin/admins`);

};

/**
 * Add a training record for an assessor
 */
exports.p_addTraining = [
    validateAddTraining,
    async (req, res) => {

        const { AssessorID, Training, Provider, Trainingday, Trainingmonth, Trainingyear } = req.body;


        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('admin/add-training', {
                errors: errors.array(),
                assessorID
            });
        }

        // Get the UserID for the given AssessorID
        const assessor = await getAssessor(AssessorID);
        const UserID = assessor.UserID;

        //Create
        const day = parseInt(Trainingday, 10);
        const month = parseInt(Trainingmonth, 10) - 1; // months are 0-indexed in JS
        const year = parseInt(Trainingyear, 10);

        const trainingDate = new Date(Date.UTC(year, month, day));

        await createTraining(UserID, Training, trainingDate, Provider);

        req.body.Training = '';
        req.body.Provider = '';
        req.body.Trainingday = '';
        req.body.Trainingmonth = '';
        req.body.Trainingyear = '';
        req.session.data.Training = '';
        req.session.data.Provider = '';
        req.session.data.Trainingday = '';
        req.session.data.Trainingmonth = '';
        req.session.data.Trainingyear = '';


        return res.redirect(`/admin/assessor/${AssessorID}`);
    }
];


exports.p_removeTraining = async function (req, res) {

    const { uniqueID } = req.body;
    const training = await getTrainingByUniqueID(uniqueID);
    const assessor = await getAssessorByUserID(training.UserID);
    const AssessorID = assessor.AssessorID;

    await deleteTraining(uniqueID);

    return res.redirect(`/admin/assessor/${AssessorID}`);

}

exports.p_changeAssessorStatus = async function (req, res) {

    const { AssessorID, changeStatus } = req.body;

    // Update assessor Active status
    const status = changeStatus === 'true' ? 1 : 0;
    await updateAssessor(AssessorID, status);

    return res.redirect(`/admin/assessor/${AssessorID}`);

}

//Save change primary contact email
exports.p_changePrimaryContact = async function (req, res) {
    const { AssessmentID, primaryContactEmail } = req.body;
    const userID = req.session.data.User.UserID;
    const department = req.session.data.User.Department;

    // Does user exist?
    let user = await getBasicUserDetailsByEmail(primaryContactEmail);

    console.log(user);

    if (!user) {
        user = await UpsertUserNoToken(primaryContactEmail, '', '', userID, 'Change primary contact', department);
    }

    await changePrimaryContact(AssessmentID, user.UserID);
    const assessment = await getAssessmentById(AssessmentID);

    // Send notify email to person who is now assigned

    const templateParams = {
        type: assessment.Type,
        description: assessment.Description,
        name: assessment.Name,
        serviceURL: process.env.serviceURL,
        id: AssessmentID,
        firstName: user.FirstName
    };

    sendNotifyEmail(process.env.email_PrimaryContactChanged, user.EmailAddress, templateParams);

    return res.redirect(`/admin/request/${AssessmentID}`);
}
