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
    const assessment = await getAssessmentById(assessmentID);

    let content = '';

    if(assessment.Type === 'Service assessment')
    {
        content = fs.readFileSync('public/assets/templates/assessment_doc.docx', 'binary');
    }
    else
    {
        content = fs.readFileSync('public/assets/templates/peerreview_doc.docx', 'binary');
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true});


    const ratings = await getServiceStandardOutcomesByAssessmentID(assessmentID);
    const actions = await getActionsForAssessmentID(assessmentID);

    let formattedDate = moment(assessment.AssessmentDateTime).format('dddd, D MMMM YYYY');

    const data = {
        param_name: assessment.Name,
        param_description: assessment.Description,
        param_phase: assessment.Phase,
        param_outcome: assessment.Outcome,
        param_comments: assessment.PanelComments,
        param_improvecomments: assessment.PanelCommentsImprove,
        param_date: formattedDate,
        // Initialize the data object with placeholders for actions
    };

    ratings.forEach(rating => {
        const keySuffix = rating.Standard; // The Standard field is used to create dynamic keys
        data[`param_${keySuffix}_outcome`] = rating.Outcome;

        const matchingActions = actions.filter(action => action.Point === rating.Standard);
        // Construct the actions array for the param_2_actions loop
        data[`param_hasActions${keySuffix}`] = matchingActions.length > 0;

        data[`param_${keySuffix}_actions`] = matchingActions.map(action => {
            return { comment: action.Comments }; // Each action is an object with a comment property
        });

        console.log(data)
    });

    // Set the data for Docxtemplater
    doc.setData(data);

    try {
        // Render the document with the data
        doc.render();
    } catch (error) {
        // Handle any errors that occur during rendering
        console.error(error);
        return res.status(500).send('An error occurred while generating the document.');
    }

    // Generate the document as a binary buffer
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });

    // Set up the filename and headers for the response
    const filename = 'assessment_report_' + assessmentID + '.docx';
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Send the generated document in the response
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
