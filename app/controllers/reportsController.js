require('dotenv').config();
const moment = require('moment');

const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ExcelJS = require('exceljs');


const { getRequestsByStatus, getAssessmentById } = require('../models/assessmentModel');
const { getServiceStandards, getServiceStandardOutcomesByAssessmentID, countOutcomesByStandard, getAssessmentDetailsByYear } = require('../models/standards');
const { getActionsForAssessmentID } = require('../models/actions');
const { assessmentPanel, assessmentPanelExtended, getActiveAssessors, addPanelMember, findAssessmentPanelByIdAndUniqueID, deleteAssessmentPanelMember } = require('../models/assessmentPanel');

exports.g_index = async function (req, res) {
    const assessments = await getRequestsByStatus('Published', req.session.data.User.Department);
    return res.render('reports/index', {
        assessments
    })
}


exports.g_report = async function (req, res) {

    const {assessmentID} = req.params;
    const assessment = await getAssessmentById(assessmentID);
    const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
    const serviceStandards = await getServiceStandards();
    const actions = await getActionsForAssessmentID(assessmentID);

    return res.render('reports/report', {
        assessment, ratings, serviceStandards, actions
    })
}


exports.g_doc = async function (req, res) {
    const assessmentID = req.params.assessmentID;
    const content = fs.readFileSync('public/assets/templates/assessment_doc.docx', 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    const assessment = await getAssessmentById(assessmentID);
    const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
    const actions = await getActionsForAssessmentID(assessmentID);

    //console.log(actions)

    let formattedDate = moment(assessment.AssessmentDateTime).format('dddd, D MMMM YYYY');

    const data = {
        param_name: assessment.Name,
        param_description: assessment.Description,
        param_phase: assessment.Phase,
        param_outcome: assessment.Outcome,
        param_comments: assessment.PanelComments,
        param_date: formattedDate,
    }

    ratings.forEach(rating => {
        const keySuffix = rating.Standard;
        data[`param_${keySuffix}_outcome`] = rating.Outcome;


        const matchingAction = actions.find(action => action.Point === rating.Standard);

        data[`param_${keySuffix}_actions`] = matchingAction ? matchingAction.Comments : 'No action required';
    });

    //console.log(data)

    doc.setData(data);

    try {
        doc.render();
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while generating the document.');
    }

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });

    const filename = 'assessment_report_' + assessmentID + '.docx';

    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    res.send(buffer);
}

exports.g_excel = async function (req, res) {
    const assessmentID = req.params.assessmentID;

    const assessment = await getAssessmentById(assessmentID);
    const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
    const actions = await getActionsForAssessmentID(assessmentID);


    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Actions');

    let formattedDate = moment(assessment.AssessmentDateTime).format('dddd, D MMMM YYYY');

    const mappedActions = actions.map(action => {
        const outcome = ratings.find(o => o.Standard === action.Point);
        return {
            ...action,
            StandardOutcome: outcome ? outcome.Outcome : 'N/A',
            ServiceName: assessment ? assessment.Name : 'N/A',
            ProjectCode: assessment ? assessment.ProjectCode : 'N/A'
        };
    });

    worksheet.columns = [
        { header: 'Action Reference', key: 'ActionID', width: 10 },
        { header: 'Assessment', key: 'AssessmentID', width: 15 },
        { header: 'Project Code', key: 'ProjectCode', width: 15 },
        { header: 'Service', key: 'ServiceName', width: 30 },
        { header: 'Standard Outcome', key: 'StandardOutcome', width: 15 },
        { header: 'Action required', key: 'Comments', width: 30 },
        { header: 'Point', key: 'Point', width: 10 },
        { header: 'Standard', key: 'Title', width: 30 },
        { header: 'Guidance', key: 'Url', width: 50 }
    ];

    mappedActions.forEach(action => {
        worksheet.addRow(action);
    });

    // Set the filename
    const filename = `actions_plan_${assessmentID}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Send the buffer
    res.send(buffer);


}
