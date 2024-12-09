const { check, validationResult } = require("express-validator");
const {
    AssessmentModel,
    createAssessment,
    getAssessmentById,
    updateAssessment,
    getDraftsForUser,
    deleteAssessment,
    getRequestsByStatus,
    getRequestsByMixedStatus,
    getActiveAssessmentsWithAssessorData,
    getAssessmentPanelByUserID,
    changePrimaryContact,
    getAllAssessments,
    createReAssessment, getAllAssessmentsNotDrafts, getAllAssessmentReportAcceptanceData
} = require("../models/assessmentModel");
const {
    assessmentPanel,
    assessmentPanelExtended,
    getActiveAssessors,
    addPanelMember,
    findAssessmentPanelByIdAndUniqueID,
    deleteAssessmentPanelMember,
} = require("../models/assessmentPanel");
const {
    getAllAssessors,
    createAssessor,
    getAssessor,
    getTrainingForUser,
    createTraining,
    getTrainingByUniqueID,
    getAssessorByUserID,
    deleteTraining,
    updateAssessor,
    updateAssessorXGov,
    updateAssessorLead,
    updateAssessorRole,
    updateAssessorExternal
} = require("../models/assessors");
const {
    validateRequest,
    validateAddPanel,
    validateAddAdmin,
    validateAddTraining,
} = require("../validation/admin");
const {
    UpsertUserNoToken,
    getBasicUserDetails,
    getBasicUserDetailsByEmail, updateName, updateEmail
} = require("../models/user");
const {
    getAllAdmins,
    addAdmin,
    getAdminByRoleID,
    deleteAdmin,
} = require("../models/userrole");
const {
    getServiceStandards,
    getServiceStandardOutcomesByAssessmentID,
    getStandardOutcomes
} = require("../models/standards");
const { getActionsForAssessmentID } = require("../models/actions");
const {
    getArtefactsForAssessment,
    addArtefact,
    getArtefactByIdAndUniqueID,
    deleteArtefact,
    copyArtefacts,
} = require("../models/artefacts");
const { getTeamForAssessmentExtended } = require("../models/team");
const { sendNotifyEmail } = require("../middleware/notify");
const { getDepartments } = require("../models/departments");
const { validateAddArtefact } = require("../validation/manage");
const {
    validatePhase,
    validateType,
    validateName,
    validateDescription,
    validateCode,
    validateDate,
    validateEndDate,
    validateEndDates,
    validatePortfolio,
    validateDD,
    validatePM,
    validateDM,
} = require("../validation/book");

const { addAuditEntry } = require('../models/audit');

const {
    getSurveyData, getSurvey
} = require("../models/survey");


const { validateChangeName, validateChangeEmail } = require('../validation/profile');

const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ExcelJS = require("exceljs");

function calculateSurveyAverages(surveys) {
    const filterScores = (scores) => scores.filter(score => score >= 1 && score <= 5);
    const calculateAverage = (scores) => {
        const validScores = filterScores(scores);
        return validScores.length ? validScores.reduce((acc, score) => acc + score, 0) / validScores.length : 0;
    };

    const preAssessmentScores = surveys.map(survey => survey.preAssessmentCall);
    const organisationScores = surveys.map(survey => survey.organisationOfServiceAssessment);
    const runningScores = surveys.map(survey => survey.runningOfAssessment);

    return {
        avgPreAssessment: calculateAverage(preAssessmentScores),
        avgOrganisation: calculateAverage(organisationScores),
        avgRunning: calculateAverage(runningScores)
    };
}

exports.g_index = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const requests = await getAllAssessments(department);
        let { filter } = req.params;

        if (!filter) {
            filter = "priority";
        }

        let filteredData = [];
        let filterView = "";

        const priority = requests.filter(
            (request) =>
                request.Status === "New" ||
                request.Status === "Team Review" ||
                request.Status === "SA Review" ||
                request.Status === "SA Publish"
        );
        const noDateRequests = requests.filter(
            (request) => request.Status === "Active" && !request.AssessmentDateTime
        );

        // Combine priority and noDateRequests
        const combinedRequests = [...priority, ...noDateRequests];

        if (filter === "priority") {
            filteredData = combinedRequests;
        }

        return res.render("admin/index", {
            filteredData,
            priority
        });
    } catch (error) {
        next(error);
    }
};


exports.g_overview = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const panel = await assessmentPanel(assessmentID);
        return res.render("admin/entry/overview", { assessment, panel });
    } catch (error) {
        next(error);
    }
};

exports.g_admin = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const primaryContact = await getBasicUserDetails(assessment.CreatedBy);
      
        const primaryContactEmail = primaryContact.EmailAddress;
        return res.render("admin/entry/admin", { assessment, primaryContactEmail });
    } catch (error) {
        next(error);
    }
};



exports.g_process = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);

        const primaryContact = await getBasicUserDetails(assessment.CreatedBy);
        const pmDetails = await getBasicUserDetails(assessment.PM);
        const dmDetails = await getBasicUserDetails(assessment.DM);
        const ddDetails = await getBasicUserDetails(assessment.DD);
        const primaryContactEmail = primaryContact.EmailAddress;

        return res.render("admin/entry/request", {
            assessment,
            primaryContactEmail,
            pmDetails,
            dmDetails,
            ddDetails,
        });
    } catch (error) {
        next(error);
    }
};

exports.g_change_primary_contact = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;

        const assessment = await getAssessmentById(assessmentID);
        const primaryContact = await getBasicUserDetails(assessment.CreatedBy);
        const primaryContactEmail = primaryContact.EmailAddress;

        return res.render("admin/entry/change-primary-contact", { assessment, primaryContactEmail });
    } catch (error) {
        next(error);
    }
};

exports.g_change_stage = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;

        const assessment = await getAssessmentById(assessmentID);

        return res.render("admin/entry/change-stage", { assessment });
    } catch (error) {
        next(error);
    }
};

exports.g_confirmDelete = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;

        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/confirm-delete", { assessment });
    } catch (error) {
        next(error);
    }
};

exports.g_panel = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const panel = await assessmentPanelExtended(assessmentID);
        return res.render("admin/entry/panel", { assessment, panel });
    } catch (error) {
        next(error);
    }
};

exports.g_addpanel = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const assessors = await getActiveAssessors();

        return res.render("admin/entry/add-panel", { assessment, assessors });
    } catch (error) {
        next(error);
    }
};

exports.g_removepanel = async function (req, res, next) {
    try {
        const { assessmentPanelID, uniqueID } = req.params;
        const assessor = await findAssessmentPanelByIdAndUniqueID(
            assessmentPanelID,
            uniqueID,
        );
        const assessment = await getAssessmentById(assessor.AssessmentID);
        return res.render("admin/entry/remove-panel", { assessment, assessor });
    } catch (error) {
        next(error);
    }
};

exports.g_adddate = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/add-date", { assessment });
    } catch (error) {
        next(error);
    }
};

exports.g_assessments = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const statuses = [
            "Active",
            "Team Review",
            "SA Review",
            "SA Publish",
            "Published",
        ];
        const active = await getRequestsByMixedStatus(statuses, department);
        const outcomes = await getStandardOutcomes();
        return res.render("admin/assessments", { assessments: active, outcomes });
    } catch (error) {
        next(error);
    }
};

exports.g_completed = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const statuses = [
            "Active",
            "Team Review",
            "SA Review",
            "SA Publish",
            "Published",
        ];
        const active = await getRequestsByMixedStatus(statuses, department);
        return res.render("admin/completed", { assessments: active });
    } catch (error) {
        next(error);
    }
};

exports.g_assessors = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const assessors = await getAllAssessors(department);
        return res.render("admin/assessors", { assessors });
    } catch (error) {
        next(error);
    }
};

exports.g_assessor = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const parsedId = parseInt(assessorID, 10);

        if (!Number.isInteger(parsedId)) {
            return res.redirect('/error')
        }

        const assessor = await getAssessor(assessorID);
        const training = await getTrainingForUser(assessor.UserID);

        return res.render("admin/assessor", { assessor, training });
    } catch (error) {
        next(error);
    }
};

exports.g_changeAssessorStatus = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const assessor = await getAssessor(assessorID);
        const training = await getTrainingForUser(assessor.UserID);

        return res.render("admin/change-assessor-status", { assessor, training });
    } catch (error) {
        next(error);
    }
};

exports.g_changeAssessorCrossgov = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const assessor = await getAssessor(assessorID);

        return res.render("admin/change-assessor-cross-gov", { assessor });
    } catch (error) {
        next(error);
    }
};

exports.g_changeAssessorLead = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const assessor = await getAssessor(assessorID);

        return res.render("admin/change-assessor-lead", { assessor });
    } catch (error) {
        next(error);
    }
};


exports.g_changeAssessorRole = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const assessor = await getAssessor(assessorID);

        return res.render("admin/change-assessor-role", { assessor });
    } catch (error) {
        next(error);
    }
};
exports.g_changeAssessorExternal = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const assessor = await getAssessor(assessorID);

        return res.render("admin/change-assessor-external", { assessor });
    } catch (error) {
        next(error);
    }
};

exports.g_changeAssessorName = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const assessor = await getAssessor(assessorID);

        return res.render("admin/change-assessor-name", { assessor });
    } catch (error) {
        next(error);
    }
};


exports.g_admins = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;

        const admins = await getAllAdmins(department);
        return res.render("admin/admins", { admins });
    } catch (error) {
        next(error);
    }
};

exports.g_removeadmin = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const { userRoleID } = req.params;
        const admin = await getAdminByRoleID(department, userRoleID);
        return res.render("admin/remove-admin", { admin });
    } catch (error) {
        next(error);
    }
};

exports.g_addassessor = async function (req, res, next) {
    try {
        const departments = await getDepartments();
        return res.render("admin/add-assessor", { departments });
    } catch (error) {
        next(error);
    }
};

exports.g_assessmentHistory = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        const assessor = await getAssessor(assessorID);
        const assessments = await getAssessmentPanelByUserID(assessor.UserID);

        return res.render("admin/assessment-history", { assessor, assessments });
    } catch (error) {
        next(error);
    }
};

exports.g_addadmin = async function (req, res, next) {
    try {
        return res.render("admin/add-admin");
    } catch (error) {
        next(error);
    }
};

exports.g_addtraining = async function (req, res, next) {
    try {
        const { assessorID } = req.params;
        return res.render("admin/add-training", { assessorID });
    } catch (error) {
        next(error);
    }
};

exports.g_removetraining = async function (req, res, next) {
    try {
        const { trainingUniqueID } = req.params;
        const training = await getTrainingByUniqueID(trainingUniqueID);
        const assessor = await getAssessorByUserID(training.UserID)
        return res.render("admin/remove-training", { training, assessor });
    } catch (error) {
        next(error);
    }
};

exports.g_report = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const ratings =
            await getServiceStandardOutcomesByAssessmentID(assessmentID);
        const serviceStandards = await getServiceStandards();
        const actions = await getActionsForAssessmentID(assessmentID);
        return res.render("admin/entry/report", {
            assessment,
            ratings,
            serviceStandards,
            actions,
        });
    } catch (error) {
        next(error);
    }
};

exports.g_artefacts = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const artefacts = await getArtefactsForAssessment(assessmentID);
        return res.render("admin/entry/artefacts", { assessment, artefacts });
    } catch (error) {
        next(error);
    }
};

exports.g_team = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const team = await getTeamForAssessmentExtended(assessmentID);
        return res.render("admin/entry/team", { assessment, team });
    } catch (error) {
        next(error);
    }
};

exports.g_reporting = async function (req, res, next) {
    try {
        return res.render("admin/reporting/index");
    } catch (error) {
        next(error);
    }
};

exports.g_reportingAssessmentsAndPanels = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const assessments = await getActiveAssessmentsWithAssessorData(department);

        return res.render("admin/reporting/assessments", {
            assessments: assessments,
        });
    } catch (error) {
        next(error);
    }
};

exports.g_reportingAssessmentsAndPanelsForSlack = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const assessments = await getActiveAssessmentsWithAssessorData(department);

        return res.render("admin/reporting/slack", {
            assessments: assessments,
        });
    } catch (error) {
        next(error);
    }
};


exports.g_reportingAssessmentsAll = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        const assessments = await getAllAssessmentsNotDrafts(department);

        return res.render("admin/reporting/all", {
            assessments: assessments,
        });
    } catch (error) {
        next(error);
    }
};


exports.g_reportacceptance = async function (req, res, next) {


    try {
        const department = req.session.data.User.Department;
        const assessments = await getAllAssessmentReportAcceptanceData(department);

        return res.render("admin/reporting/reportacceptance", {
            assessments: assessments,
        });
    } catch (error) {
        next(error);
    }


};


exports.g_exportAssessmentReport = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;
        // Assuming getActiveAssessmentsWithAssessorData returns data in the structure matching the HTML table
        const assessments = await getActiveAssessmentsWithAssessorData(department);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Assessments");

        // Define columns based on your HTML table headers
        worksheet.columns = [
            { header: "Service", key: "service", width: 25 },
            { header: "Description", key: "description", width: 60 },
            { header: "Phase", key: "phase", width: 15 },
            { header: "Type", key: "type", width: 20 },
            { header: "Date", key: "date", width: 15 },
            { header: "Time", key: "time", width: 15 },
            { header: "Lead", key: "lead", width: 20 },
            { header: "Design", key: "design", width: 20 },
            { header: "UR", key: "ur", width: 20 },
            { header: "Tech", key: "tech", width: 20 },
            { header: "Performance", key: "performance", width: 20 },
        ];

        // Add rows for each assessment
        assessments.forEach((assessment) => {
            // Add a row for each assessment
            const row = worksheet.addRow({
                service: {
                    text: assessment.Name,
                    hyperlink: `https://localhost:3000/volunteer/detail/${assessment.AssessmentID}`,
                },
                description: assessment.Description,
                phase: assessment.Phase,
                type: assessment.Type,
                date: assessment.AssessmentDateTime,
                time: assessment.AssessmentTime,
                lead: assessment.Lead || "-", // Assuming you might have empty values
                design: assessment.Design || "-",
                ur: assessment.UR || "-",
                tech: assessment.Tech || "-",
                performance: assessment.Performance || "-",
            });

            // Optional: Set style for hyperlink (blue color & underlined text)
            row.getCell("service").style = {
                font: { color: { argb: "FF0000FF" }, underline: true },
            };
        });

        // Generate filename based on department and current timestamp for uniqueness
        const filename = `assessments_report_${Date.now()}.xlsx`;

        // Set response headers to prompt download with the generated filename
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        // Write the workbook to a buffer and send as response
        workbook.xlsx
            .writeBuffer()
            .then((buffer) => {
                res.send(buffer);
            })
            .catch((error) => {
                console.error("Error writing Excel to buffer", error);
                res.status(500).send("Error generating Excel file");
            });
    } catch (error) {
        next(error);
    }
};



exports.g_exportAllAssessmentReport = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;

        const assessments = await getAllAssessmentsNotDrafts(department);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Assessments");

        // Define columns based on your HTML table headers
        worksheet.columns = [
            { header: "Service", key: "service", width: 25 },
            { header: "Description", key: "description", width: 60 },
            { header: "Status", key: "status", width: 15 },
            { header: "Phase", key: "phase", width: 15 },
            { header: "Type", key: "type", width: 20 },
            { header: "Assessment Date", key: "date", width: 15 },
            { header: "Assessment Time", key: "time", width: 15 },
            { header: "Outcome", key: "outcome", width: 15 },
            { header: "Code", key: "code", width: 15 },
            { header: "Portfolio", key: "portfolio", width: 25 },
            { header: "PhaseStart", key: "phaseStart", width: 25 },
            { header: "PhaseEnd", key: "phaseEnd", width: 25 },
            { header: "BookedDate", key: "submitted", width: 25 },
            { header: "Deputy Director", key: "dd", width: 25 },
            { header: "Delivery Manager", key: "dm", width: 25 },
            { header: "Product Manager", key: "pm", width: 25 },
        ];

        // Add rows for each assessment
        assessments.forEach((assessment) => {
            // Add a row for each assessment
            const row = worksheet.addRow({
                service: {
                    text: assessment.Name,
                    hyperlink: `https://service-assessments.education.gov.uk/admin/overview/${assessment.AssessmentID}`,
                },
                description: assessment.Description,
                status: assessment.Status,
                phase: assessment.Phase,
                type: assessment.Type,
                date: assessment.AssessmentDateTime,
                time: assessment.AssessmentTime,
                outcome: assessment.Outcome,
                code: assessment.ProjectCode,
                portfolio: assessment.Portfolio,
                phaseStart: assessment.StartDate,
                phaseEnd: assessment.EndDate,
                submitted: assessment.CreatedDate,
                dd: assessment.DDFirstName + ' ' + assessment.DDLastName,
                dm: assessment.DMFirstName + ' ' + assessment.DMLastName,
                pm: assessment.PMFirstName + ' ' + assessment.PMLastName
            });

            // Optional: Set style for hyperlink (blue color & underlined text)
            row.getCell("service").style = {
                font: { color: { argb: "FF0000FF" }, underline: true },
            };
        });

        // Generate filename based on department and current timestamp for uniqueness
        const filename = `all_assessments_${Date.now()}.xlsx`;

        // Set response headers to prompt download with the generated filename
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        // Write the workbook to a buffer and send as response
        workbook.xlsx
            .writeBuffer()
            .then((buffer) => {
                res.send(buffer);
            })
            .catch((error) => {
                console.error("Error writing Excel to buffer", error);
                res.status(500).send("Error generating Excel file");
            });
    } catch (error) {
        next(error);
    }
};

exports.g_exportAreportacceptanceReport = async function (req, res, next) {
    try {
        const department = req.session.data.User.Department;

        const assessments = await getAllAssessmentReportAcceptanceData(department);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Assessments");

        // Define columns based on your HTML table headers
        worksheet.columns = [
            { header: "Service", key: "service", width: 25 },
            { header: "Phase", key: "phase", width: 15 },
            { header: "Type", key: "type", width: 20 },
            { header: "Sent to team", key: "sent", width: 15 },
            { header: "Accepted by team", key: "accepted", width: 15 },
            { header: "Working days elapsed", key: "days", width: 15 }
        ];

        // Add rows for each assessment
        assessments.forEach((assessment) => {
            // Add a row for each assessment
            const row = worksheet.addRow({
                service: {
                    text: assessment.Name,
                    hyperlink: `https://service-assessments.education.gov.uk/admin/overview/${assessment.AssessmentID}`,
                },
                status: assessment.Status,
                phase: assessment.Phase,
                type: assessment.Type,
                sent: assessment.ReportSentTime,
                accepted: assessment.ReportAcceptedTime,
                days: assessment.TimeDifferenceInWorkingDays
            });

            // Optional: Set style for hyperlink (blue color & underlined text)
            row.getCell("service").style = {
                font: { color: { argb: "FF0000FF" }, underline: true },
            };
        });

        // Generate filename based on department and current timestamp for uniqueness
        const filename = `all_reportacceptance_${Date.now()}.xlsx`;

        // Set response headers to prompt download with the generated filename
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        // Write the workbook to a buffer and send as response
        workbook.xlsx
            .writeBuffer()
            .then((buffer) => {
                res.send(buffer);
            })
            .catch((error) => {
                console.error("Error writing Excel to buffer", error);
                res.status(500).send("Error generating Excel file");
            });
    } catch (error) {
        next(error);
    }
};


exports.g_addartefact = async function (req, res, next) {
    try {
        const assessmentID = req.params.assessmentID;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/add-artefact", {
            assessment,
        });
    } catch (error) {
        next(error);
    }
};

exports.g_removeartefact = async function (req, res, next) {
    try {
        const { artefactID, uniqueID } = req.params;
        const artefact = await getArtefactByIdAndUniqueID(artefactID, uniqueID);

        const assessment = await getAssessmentById(artefact.AssessmentID);
        return res.render("admin/entry/remove-artefact", { assessment, artefact });
    } catch (error) {
        next(error);
    }
};

exports.g_changetype = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/change-type", { assessment });
    } catch (error) {
        next(error);
    }
};

exports.g_changePhase = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/change-phase", { assessment });
    } catch (error) {
        next(error);
    }
};

exports.g_changeName = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/change-name", { assessment });
    } catch (error) {
        next(error);
    }
};

exports.g_changeDescription = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/change-description", { assessment });
    } catch (error) {
        next(error);
    }
};
exports.g_changeCode = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/change-code", { assessment });
    } catch (error) {
        next(error);
    }
};
exports.g_changePortfolio = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        return res.render("admin/entry/change-portfolio", { assessment });
    } catch (error) {
        next(error);
    }
};
exports.g_changeDD = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        let userDetails = {};
        if (assessment.DD) {
            userDetails = await getBasicUserDetails(assessment.DD);
        }
        return res.render("admin/entry/change-dd", { assessment, userDetails });
    } catch (error) {
        next(error);
    }
};

exports.g_changePM = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        let userDetails = {};
        if (assessment.PM) {
            userDetails = await getBasicUserDetails(assessment.PM);
        }
        return res.render("admin/entry/change-pm", { assessment, userDetails });
    } catch (error) {
        next(error);
    }
};

exports.g_changeDM = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        let userDetails = {};
        if (assessment.DM) {
            userDetails = await getBasicUserDetails(assessment.DM);
        }
        return res.render("admin/entry/change-dm", { assessment, userDetails });
    } catch (error) {
        next(error);
    }
};

exports.g_createReassessment = async function (req, res, next) {
    try {
        const { assessmentID } = req.params;
        const assessment = await getAssessmentById(assessmentID);
        const ratings =
            await getServiceStandardOutcomesByAssessmentID(assessmentID);
        const serviceStandards = await getServiceStandards();
        const actions = await getActionsForAssessmentID(assessmentID);
        return res.render("admin/entry/create-reassessment", {
            assessment,
            ratings,
            serviceStandards,
            actions,
        });
    } catch (error) {
        next(error);
    }
};


exports.g_surveys = async function (req, res, next) {
    try {
        // Extract department ID from the user session
        const departmentID = req.session.data.User.Department;

        if (!departmentID) {
            const error = new Error("Department ID is required but was not found in the session.");
            error.status = 400; // Bad Request
            throw error;
        }

        const surveys = await getSurveyData(departmentID);

        const { avgPreAssessment, avgOrganisation, avgRunning } = calculateSurveyAverages(surveys);

        return res.render('admin/surveys', {
            surveys,
            avgPreAssessment,
            avgOrganisation,
            avgRunning
        });

    } catch (error) {
        return next(error);
    }
};


exports.g_surveyResponse = async function (req, res, next) {
    try {
        // Extract department ID from the user session
        const { surveyID } = req.params;
        const survey = await getSurvey(surveyID);
        const assessors = await assessmentPanelExtended(survey.AssessmentID)
        return res.render('admin/survey-response', {
            survey, assessors
        });

    } catch (error) {
        return next(error);
    }
};



// POSTS

exports.p_addartefact = [
    validateAddArtefact,
    async (req, res, next) => {
        try {
            const { Title, Description, URL, AssessmentID } = req.body;

            var assessment = await getAssessmentById(AssessmentID);

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render("admin/entry/add-artefact", {
                    assessment,
                    errors: errors.array(),
                });
            }

            await addArtefact(
                AssessmentID,
                Title,
                Description,
                URL,
                req.session.data.User.UserID,
            );

            // Clear the body and data for the fields
            req.body = {};
            req.session.data.Title = "";
            req.session.data.Description = "";
            req.session.data.URL = "";

            return res.redirect(`/admin/artefacts/${AssessmentID}`);
        } catch (error) {
            next(error);
        }
    },
];

exports.p_removeartefact = async function (req, res, next) {
    try {
        const { ArtefactID, UniqueID } = req.body;

        // ToDo: Validate the deletion request, can the user actually delete the request?

        // If artefact isn't a number, redirect to the artefacts page
        if (isNaN(ArtefactID)) {
            return res.redirect("/admin");
        }

        const artefact = await getArtefactByIdAndUniqueID(ArtefactID, UniqueID);

        if (artefact !== null) {
            await deleteArtefact(ArtefactID);
            return res.redirect(`/admin/artefacts/${artefact.AssessmentID}`);
        }

        return res.redirect("/admin");
    } catch (error) {
        next(error);
    }
};

exports.p_process = [
    validateRequest,
    async (req, res, next) => {
        try {
            const { assessmentID, process } = req.body;
            const userID = req.session.data.User.UserID;

            var assessment = await getAssessmentById(assessmentID);

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render("admin/entry/request", {
                    assessment,
                    errors: errors.array(),
                });
            }

            const newStatus = process == "Accept" ? "Active" : "Rejected";
            assessment.Status = newStatus;

            await updateAssessment(assessmentID, assessment, userID);

            await addAuditEntry(assessmentID, "Request processes", "Booking request: " + newStatus, req.session.data.User.UserID);

            return res.redirect(`/admin/overview/${assessmentID}`);
        } catch (error) {
            next(error);
        }
    },
];



exports.p_confirmDelete = async function (req, res, next) {

    try {
        const {assessmentID, process } = req.body;

        return res.redirect(`/admin/request/confirm-delete/${assessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_addpanel = [
    validateAddPanel,
    async (req, res, next) => {
        try {
            const { AssessmentID, Assessor, Role } = req.body;

            const errors = validationResult(req);
            const assessment = await getAssessmentById(AssessmentID);
            const assessors = await getActiveAssessors();

            if (!errors.isEmpty()) {
                return res.render("admin/entry/add-panel", {
                    assessment,
                    assessors,
                    errors: errors.array(),
                });
            }

            const panel = await addPanelMember(AssessmentID, Assessor, Role);
            const assessorInfo = await getAssessorByUserID(Assessor);
            const assessmentDateTime = new Date(assessment.AssessmentDateTime);

            // TODO: Put into a function

            // Define arrays for weekdays and months
            const weekdays = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            const months = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ];

            // Get the weekday, day, month, and year components from the date
            const weekday = weekdays[assessmentDateTime.getDay()];
            const day = assessmentDateTime.getDate();
            const month = months[assessmentDateTime.getMonth()];
            const year = assessmentDateTime.getFullYear();

            // Construct the formatted date string
            const formattedDate = `${weekday} ${day} ${month} ${year}`;

            const templateParams = {
                phase: assessment.Phase.toLowerCase(),
                type: assessment.Type.toLowerCase(),
                name: assessment.Name,
                time: assessment.AssessmentTime,
                date: formattedDate,
                serviceURL: process.env.serviceURL,
                id: AssessmentID,
                assessorName: assessorInfo.FirstName,
                role: Role.toLowerCase(),
            };

            if (templateParams.role === 'observer') {
                templateParams.observerName = assessorInfo.FirstName,

                    sendNotifyEmail(
                        process.env.email_AddedToPanelObserver,
                        assessorInfo.EmailAddress,
                        templateParams,
                    );
            } else {
                sendNotifyEmail(
                    process.env.email_AddedToPanel,
                    assessorInfo.EmailAddress,
                    templateParams,
                );
            }

            return res.redirect(`/admin/panel/${AssessmentID}`);
        } catch (error) {
            next(error);
        }
    },
];

exports.p_removepanel = async function (req, res, next) {
    try {
        const { AssessmentPanelID, UniqueID, AssessmentID } = req.body;
        await deleteAssessmentPanelMember(UniqueID);
        return res.redirect(`/admin/panel/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_adddate = async function (req, res, next) {
    try {
        const userID = req.session.data.User.UserID;
        const {
            AssessmentID,
            AssessmentDate_day,
            AssessmentDate_month,
            AssessmentDate_year,
            AssessmentTime,
            CustomTime,
        } = req.body;

        const assessment = await getAssessmentById(AssessmentID);

        const day = parseInt(AssessmentDate_day, 10);
        const month = parseInt(AssessmentDate_month, 10) - 1; // months are 0-indexed in JS
        const year = parseInt(AssessmentDate_year, 10);

        const assessmentDate = new Date(Date.UTC(year, month, day));
        assessment.AssessmentDateTime = assessmentDate.toISOString();
        assessment.AssessmentTime = CustomTime;

        await updateAssessment(AssessmentID, assessment, userID);

        await addAuditEntry(AssessmentID, "Assessment date added", "Assessment updated with assessment date: " + assessmentDate.toISOString() + " - " + CustomTime, req.session.data.User.UserID);

        return res.redirect(`/admin/overview/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_addassessor = async function (req, res, next) {
    try {
        const user = req.session.data.User;

        const {
            FirstName,
            LastName,
            crossGovAssessor,
            leadAssessor,
            externalAssessor,
            Role,
        } = req.body;
        let { EmailAddress } = req.body;

        // Validate we have all the data we need
        const validationErrors = [];

        if (!FirstName) {
            validationErrors.push({
                field: "FirstName",
                message: "Enter a first name",
            });
        }

        if (!LastName) {
            validationErrors.push({
                field: "LastName",
                message: "Enter a last name",
            });
        }

        if (!EmailAddress) {
            validationErrors.push({
                field: "EmailAddress",
                message: "Enter a valid email address",
            });
        }

        if (!Role) {
            validationErrors.push({ field: "Role", message: "Select a role" });
        }

        if (!crossGovAssessor) {
            validationErrors.push({
                field: "crossGovAssessor",
                message: "Select if the person is a cross gov assessor or not",
            });
        }

        if (!leadAssessor) {
            validationErrors.push({
                field: "leadAssessor",
                message: "Select if the person is a lead assessor or not",
            });
        }

        if (!externalAssessor) {
            validationErrors.push({
                field: "externalAssessor",
                message: "Select if the assessor is external to the department",
            });
        }

        if (validationErrors.length > 0) {
            return res.render("admin/add-assessor", { errors: validationErrors });
        }

        // good to continue

        // Add user

        // Figure out the department from the email address, and check against the departments domain
        const emailParts = EmailAddress.split("@");
        const domain = emailParts[1];
        const departments = await getDepartments();
        let department = departments.find((d) => d.Domain === domain);

        if (department === undefined) {
            department = 0;
        } else {
            department = department.DepartmentID;
        }

        let emailAddress = EmailAddress.toLowerCase();

        const userx = await UpsertUserNoToken(
            emailAddress,
            FirstName,
            LastName,
            user.UserID,
            "Create assessor",
            department,
        );

        if (userx) {
            const xgov = crossGovAssessor === "Yes" ? 1 : 0;
            const lead = leadAssessor === "Yes" ? 1 : 0;
            const external = externalAssessor === "Yes" ? 1 : 0;

            const assessor = await createAssessor(
                userx,
                Role,
                xgov,
                lead,
                external,
                user.Department,
            );

            // Clear the request body
            req.session.data.FirstName = "";
            req.session.data.LastName = "";
            req.session.data.crossGovAssessor = "";
            req.session.data.leadAssessor = "";
            req.session.data.externalAssessor = "";
            req.session.data.Role = "";
            req.session.data.EmailAddress = "";
        }

        return res.redirect("/admin/assessors");
    } catch (error) {
        next(error);
    }
};

exports.p_sendReport = async function (req, res, next) {
    try {
        const { AssessmentID } = req.body;
        const assessment = await getAssessmentById(AssessmentID);
        const userID = req.session.data.User.UserID;
        const submittor = await getBasicUserDetails(assessment.CreatedBy);
        const dm = await getBasicUserDetails(assessment.DM);
        assessment.Status = "Team Review";
        await updateAssessment(AssessmentID, assessment, userID);
        const templateParams = {
            phase: assessment.Phase,
            type: assessment.Type,
            name: assessment.Name,
            serviceURL: process.env.serviceURL,
            id: AssessmentID,
        };

        sendNotifyEmail(
            process.env.email_ReportReady,
            submittor.EmailAddress,
            templateParams,
        );

        if (assessment.PM) {
            const pm = await getBasicUserDetails(assessment.PM);
            if (pm.EmailAddress) {
                sendNotifyEmail(
                    process.env.email_ReportReady,
                    pm.EmailAddress,
                    templateParams,
                );
            }
        }

        if (assessment.DM) {
            const dm = await getBasicUserDetails(assessment.DM);
            if (dm.EmailAddress) {
                sendNotifyEmail(
                    process.env.email_ReportReady,
                    dm.EmailAddress,
                    templateParams,
                );
            }
        }

        await addAuditEntry(AssessmentID, "Report sent to team", "Assessment report has been sent to the team.", req.session.data.User.UserID);

        return res.redirect("/admin/report/" + AssessmentID);
    } catch (error) {
        next(error);
    }
};

exports.p_publishReport = async function (req, res, next) {
    try {
        const { AssessmentID } = req.body;
        const user = req.session.data.User;

        const assessment = await getAssessmentById(AssessmentID);
        assessment.Status = "Published";

        await updateAssessment(AssessmentID, assessment, user.UserID);

        // Send email to everyone for feedback, the assessors, the service team, requestor

        try {
            const templateParams = {
                phase: assessment.Phase,
                type: assessment.Type,
                name: assessment.Name,
                serviceURL: process.env.serviceURL,
                id: AssessmentID,
            };

            const panel = await assessmentPanelExtended(AssessmentID);

            panel.forEach(async (member) => {
                const memberDetails = await getBasicUserDetails(member.UserID);
                sendNotifyEmail(
                    process.env.email_Survey,
                    memberDetails.EmailAddress,
                    templateParams,
                );
            });

            const submittor = await getBasicUserDetails(assessment.CreatedBy);

            sendNotifyEmail(
                process.env.email_ReportPublished,
                submittor.EmailAddress,
                templateParams,
            );

            sendNotifyEmail(
                process.env.email_Survey,
                submittor.EmailAddress,
                templateParams,
            );

            const team = await getTeamForAssessmentExtended(AssessmentID);

            team.forEach(async (member) => {
                const memberDetails = await getBasicUserDetails(member.UserID);
                sendNotifyEmail(
                    process.env.email_Survey,
                    memberDetails.EmailAddress,
                    templateParams,
                );
            });
        } catch (error) {
            // Should log this error
        }

        await addAuditEntry(AssessmentID, "Report published", "Assessment report has been published.", req.session.data.User.UserID);

        return res.redirect("/admin/report/" + AssessmentID);
    } catch (error) {
        next(error);
    }
};

exports.p_addadmin = [
    validateAddAdmin,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render("admin/entry/add-admin", {
                    assessment,
                    assessors,
                    errors: errors.array(),
                });
            }

            const user = req.session.data.User;
            const department = req.session.data.User.Department;

            const { FirstName, LastName, EmailAddress, createAsLead } = req.body;

            const admin = addAdmin(
                FirstName,
                LastName,
                EmailAddress,
                department,
                createAsLead,
                user.UserID,
            );

            return res.redirect(`/admin/admins`);
        } catch (error) {
            next(error);
        }
    },
];

exports.p_removeadmin = async function (req, res, next) {
    try {
        const { userRoleID } = req.body;
        const userID = req.session.data.User.UserID;

        const department = req.session.data.User.Department;
        await deleteAdmin(userRoleID, department, userID);

        return res.redirect(`/admin/admins`);
    } catch (error) {
        next(error);
    }
};

/**
 * Add a training record for an assessor
 */
exports.p_addTraining = [
    validateAddTraining,
    async (req, res, next) => {
        try {
            const {
                AssessorID,
                Training,
                Provider,
                Trainingday,
                Trainingmonth,
                Trainingyear,
            } = req.body;

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render("admin/add-training", {
                    errors: errors.array(),
                    assessorID,
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

            req.body.Training = "";
            req.body.Provider = "";
            req.body.Trainingday = "";
            req.body.Trainingmonth = "";
            req.body.Trainingyear = "";
            req.session.data.Training = "";
            req.session.data.Provider = "";
            req.session.data.Trainingday = "";
            req.session.data.Trainingmonth = "";
            req.session.data.Trainingyear = "";

            return res.redirect(`/admin/assessor/${AssessorID}`);
        } catch (error) {
            next(error);
        }
    },
];

exports.p_removeTraining = async function (req, res, next) {
    try {
        const { uniqueID } = req.body;
        const training = await getTrainingByUniqueID(uniqueID);
        const assessor = await getAssessorByUserID(training.UserID);
        const AssessorID = assessor.AssessorID;

        await deleteTraining(uniqueID);

        return res.redirect(`/admin/assessor/${AssessorID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeAssessorStatus = async function (req, res, next) {
    try {
        const { AssessorID, changeStatus } = req.body;

        // Update assessor Active status
        const status = changeStatus === "true" ? 1 : 0;
        await updateAssessor(AssessorID, status);

        return res.redirect(`/admin/assessor/${AssessorID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeAssessorCrossgov = async function (req, res, next) {
    try {
        const { AssessorID, crossGovAssessor } = req.body;

        // Update assessor Active status
        const status = crossGovAssessor === "Yes" ? 1 : 0;
        await updateAssessorXGov(AssessorID, status);

        return res.redirect(`/admin/assessor/${AssessorID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeAssessorLead = async function (req, res, next) {
    try {
        const { AssessorID, leadAssessor } = req.body;

        // Update assessor Active status
        const status = leadAssessor === "Yes" ? 1 : 0;
        await updateAssessorLead(AssessorID, status);

        return res.redirect(`/admin/assessor/${AssessorID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeAssessorRole = async function (req, res, next) {
    try {
        const { AssessorID, Role } = req.body;

        // Update assessor Active status
        await updateAssessorRole(AssessorID, Role);

        return res.redirect(`/admin/assessor/${AssessorID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeAssessorExternal = async function (req, res, next) {
    try {
        const { AssessorID, externalAssessor } = req.body;

        // Update assessor Active status
        const status = externalAssessor === "Yes" ? 1 : 0;
        await updateAssessorExternal(AssessorID, status);

        return res.redirect(`/admin/assessor/${AssessorID}`);
    } catch (error) {
        next(error);
    }
};


exports.p_changeAssessorName = [
    validateChangeName,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            const { AssessorID, firstName, lastName } = req.body;

            console.log(errors)
            const assessor = await getAssessor(AssessorID);
            if (!errors.isEmpty()) {

                return res.render('admin/change-assessor-name', {
                    errors: errors.array(), assessor
                });
            }


            // Update existing assessment
            await updateName(firstName, lastName, assessor.UserID);

            return res.redirect(`/admin/assessor/${AssessorID}`);
        } catch (error) {
            next(error)
        }

    }
];

//Save change primary contact email
exports.p_changePrimaryContact = async function (req, res, next) {
    try {


        const { AssessmentID, primaryContactEmail } = req.body;

        const ass = await getAssessmentById(AssessmentID);
        const oldContactEmail = await getBasicUserDetails(ass.CreatedBy);


        const userID = req.session.data.User.UserID;
        const department = req.session.data.User.Department;

        // Does user exist?
        let user = await getBasicUserDetailsByEmail(primaryContactEmail);

        if (!user) {
            user = await UpsertUserNoToken(
                primaryContactEmail,
                "",
                "",
                userID,
                "Change primary contact",
                department,
            );
        }

        await changePrimaryContact(AssessmentID, user.UserID);
        const assessment = await getAssessmentById(AssessmentID);


        let newContactEmail = user.EmailAddress

        // Send notify email to person who is now assigned

        const templateParams = {
            type: assessment.Type,
            description: assessment.Description,
            name: assessment.Name,
            serviceURL: process.env.serviceURL,
            id: AssessmentID,
            firstName: user.FirstName,
        };

        sendNotifyEmail(
            process.env.email_PrimaryContactChanged,
            user.EmailAddress,
            templateParams,
        );

        await addAuditEntry(AssessmentID, "Admin", "Changed primary contact email from: " + oldContactEmail.EmailAddress + " to: " + newContactEmail, req.session.data.User.UserID);

        return res.redirect(`/admin/management/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeType = async function (req, res, next) {
    try {
        const { AssessmentID, Type } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);

        const oldType = assessment.Type;

        assessment.Type = Type;
        await updateAssessment(AssessmentID, assessment, userID);

        await addAuditEntry(AssessmentID, "Admin", "Changed type from: " + oldType + " to: " + Type, req.session.data.User.UserID);


        return res.redirect(`/admin/request/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_change_stage = async function (req, res, next) {

    console.log(req.session.data.User);
    try {

        const { AssessmentID, newStage } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);

        const oldStage = assessment.Status;

        assessment.Status = newStage;

        await updateAssessment(AssessmentID, assessment, userID);

        await addAuditEntry(AssessmentID, "Admin", "Changed stage from: " + oldStage + " to: " + newStage, req.session.data.User.UserID);


        return res.redirect(`/admin/management/${AssessmentID}`);

    } catch (error) {
        next(error);
    }
};

exports.p_changePhase = async function (req, res, next) {
    try {
        const { AssessmentID, Phase } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);
        assessment.Phase = Phase;
        await updateAssessment(AssessmentID, assessment, userID);

        return res.redirect(`/admin/request/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeName = async function (req, res, next) {
    try {
        const { AssessmentID, Name } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);
        assessment.Name = Name;
        await updateAssessment(AssessmentID, assessment, userID);

        return res.redirect(`/admin/request/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeDescription = async function (req, res, next) {
    try {
        const { AssessmentID, Description } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);
        assessment.Description = Description;
        await updateAssessment(AssessmentID, assessment, userID);

        return res.redirect(`/admin/request/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeCode = async function (req, res, next) {
    try {
        const { AssessmentID, ProjectCode } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);
        assessment.ProjectCode = ProjectCode;
        await updateAssessment(AssessmentID, assessment, userID);

        return res.redirect(`/admin/request/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changePortfolio = async function (req, res, next) {
    try {
        const { AssessmentID, Portfolio } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);
        assessment.Portfolio = Portfolio;
        await updateAssessment(AssessmentID, assessment, userID);

        return res.redirect(`/admin/request/${AssessmentID}`);
    } catch (error) {
        next(error);
    }
};

exports.p_changeDD = [
    validateDD,
    async (req, res, next) => {
        try {
            const { AssessmentID, ddemail } = req.body;
            let model = await getAssessmentById(AssessmentID);

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render("admin/entry/change-dd", {
                    errors: errors.array(),
                    assessment: model,
                });
            }

            const userID = req.session.data.User.UserID;


            let ddUserID = await UpsertUserNoToken(
                ddemail,
                "",
                "",
                userID,
                "Edit request: " + AssessmentID,
                req.session.data.User.Department,
            );
            model.DD = ddUserID;

            await updateAssessment(AssessmentID, model, userID);
            return res.redirect("/admin/request/" + AssessmentID);
        } catch (error) {
            next(error);
        }
    },
];

exports.p_changePM = [
    validatePM,
    async (req, res, next) => {
        try {
            const { AssessmentID, pm } = req.body;

            const errors = validationResult(req);

            let tempModel = await getAssessmentById(AssessmentID);

            tempModel.PMYN = pm;

            if (!errors.isEmpty()) {
                return res.render("admin/entry/change-pm", {
                    assessment: tempModel,
                    errors: errors.array(),
                });
            }

            const modelData =
                req.session.data && req.session.data.AssessmentID
                    ? { ...req.body, AssessmentID: req.session.data.AssessmentID }
                    : req.body;

            let model = new AssessmentModel(modelData);

            const userID = req.session.data.User.UserID;

            model = await getAssessmentById(AssessmentID);

            if (req.body.pm === "Yes") {
                let pmUserID = await UpsertUserNoToken(
                    req.body.pmemail,
                    "",
                    "",
                    userID,
                    "Admin request: " + AssessmentID,
                );
                model.PM = pmUserID;
                model.PMYN = "Yes";
            } else {
                model.PM = null;
                model.PMYN = "No";
            }

            // Update existing assessment
            await updateAssessment(AssessmentID, model, userID);

            return res.redirect("/admin/request/" + AssessmentID);
        } catch (error) {
            next(error);
        }
    },
];

exports.p_changeDM = [
    validateDM,
    async (req, res, next) => {
        try {
            const { AssessmentID, dm } = req.body;

            const errors = validationResult(req);

            let tempModel = await getAssessmentById(AssessmentID);

            tempModel.DMYN = dm;

            if (!errors.isEmpty()) {
                return res.render("admin/entry/change-dm", {
                    assessment: tempModel,
                    errors: errors.array(),
                });
            }

            const modelData =
                req.session.data && req.session.data.AssessmentID
                    ? { ...req.body, AssessmentID: req.session.data.AssessmentID }
                    : req.body;

            let model = new AssessmentModel(modelData);

            const userID = req.session.data.User.UserID;

            model = await getAssessmentById(AssessmentID);

            if (req.body.dm === "Yes") {
                let dmUserID = await UpsertUserNoToken(
                    req.body.dmemail,
                    "",
                    "",
                    userID,
                    "Admin request: " + AssessmentID,
                );
                model.DM = dmUserID;
                model.DMYN = "Yes";
            } else {
                model.DM = null;
                model.DMYN = "No";
            }

            // Update existing assessment
            await updateAssessment(AssessmentID, model, userID);

            return res.redirect("/admin/request/" + AssessmentID);
        } catch (error) {
            next(error);
        }
    },
];

exports.p_createReassessment = async function (req, res, next) {
    try {
        const { AssessmentID } = req.body;
        const userID = req.session.data.User.UserID;

        const assessment = await getAssessmentById(AssessmentID);

        const newAssessmentID = await createReAssessment(AssessmentID);
        await copyArtefacts(AssessmentID, newAssessmentID);
        await addArtefact(
            newAssessmentID,
            "Previous assessment report",
            "Rating: " + assessment.Outcome,
            process.env.serviceURL + "/reports/report/" + assessment.AssessmentID,
            req.session.data.User.UserID,
        );

        assessment.SubStatusCode = newAssessmentID;
        await updateAssessment(AssessmentID, assessment, userID);

        return res.redirect(`/admin/overview/${newAssessmentID}`);
    } catch (error) {
        next(error)
    }
};