const { AssessmentModel, createAssessment, getAssessmentById, updateAssessment, getDraftsForUser, deleteAssessment, getRequestsByStatus, getRequestsByMixedStatus } = require('../models/assessmentModel');
const { getServiceStandards, getServiceStandardOutcomesByAssessmentID, countOutcomesByStandard, getAssessmentDetailsByYear } = require('../models/standards');

exports.g_index = async function (req, res) {

    let year;

    if (req.params.year && !isNaN(req.params.year)) {
        year = parseInt(req.params.year, 10);
    } else {
        year = new Date().getFullYear(); // Default to current year if no valid year provided
    }

    let currentYear = new Date().getFullYear();


    // Get all assessments
    const results = await getRequestsByStatus("Published");
    const standards = await countOutcomesByStandard(year);
    const data = await getAssessmentDetailsByYear(year);

    let heatmap = data.reduce((acc, item) => {
        acc[item.AssessmentID] = acc[item.AssessmentID] || [];
        acc[item.AssessmentID].push(item);
        return acc;
    }, {});


    return res.render('analysis/index', {
        results, standards, heatmap, year, currentYear
    })
}

exports.g_portfolio = async function (req, res) {
    let year;

    if (req.params.year && !isNaN(req.params.year)) {
        year = parseInt(req.params.year, 10);
    } else {
        year = new Date().getFullYear(); // Default to current year if no valid year provided
    }

    let currentYear = new Date().getFullYear();
    return res.render('analysis/portfolio', {year, currentYear})
}