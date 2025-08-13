const { getRequestsByStatus } = require('../models/assessmentModel');
const { countOutcomesByStandard, getAssessmentDetailsByYear } = require('../models/standards');
const { addAuditEntry } = require('../models/audit');

exports.g_index = async function (req, res, next) {
    try {
        let year;

        if (req.params.year && !isNaN(req.params.year)) {
            year = parseInt(req.params.year, 10);
        } else {
            year = new Date().getFullYear();
        }

        let currentYear = new Date().getFullYear();
        const department = req.session.data.User.Department;


        // Get all assessments
        const results = await getRequestsByStatus("Published", department);


        const standards = await countOutcomesByStandard(department);
        const data = await getAssessmentDetailsByYear(department);
        
        // Debug: Log the raw data to see what we're getting
        console.log('Raw data from getAssessmentDetailsByYear:', data.slice(0, 2));

        let heatmap = data.reduce((acc, item) => {
            acc[item.AssessmentID] = acc[item.AssessmentID] || [];
            acc[item.AssessmentID].push(item);
            return acc;
        }, {});

        // Sort assessments by AssessmentDateTime in descending order
        const sortedHeatmapEntries = Object.entries(heatmap)
            .sort(([, a], [, b]) => {
                // All items in a group have the same AssessmentDateTime, so use the first one
                const dateA = new Date(a[0].AssessmentDateTime || 0);
                const dateB = new Date(b[0].AssessmentDateTime || 0);
                return dateB - dateA; // Descending order (newest first)
            });

        return res.render('analysis/index', {
            results, standards, heatmap, sortedHeatmapEntries, year, currentYear
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_portfolio = async function (req, res, next) {
    try {
        let year;

        if (req.params.year && !isNaN(req.params.year)) {
            year = parseInt(req.params.year, 10);
        } else {
            year = new Date().getFullYear(); 
        }

        let currentYear = new Date().getFullYear();
        return res.render('analysis/portfolio', { year, currentYear })
    }
    catch (error) {
        next(error)
    }
}


