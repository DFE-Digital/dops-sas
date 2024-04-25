const { getRequestsByStatus } = require('../models/assessmentModel');
const { countOutcomesByStandard, getAssessmentDetailsByYear } = require('../models/standards');

exports.g_index = async function (req, res) {
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

        let heatmap = data.reduce((acc, item) => {
            acc[item.AssessmentID] = acc[item.AssessmentID] || [];
            acc[item.AssessmentID].push(item);
            return acc;
        }, {});


        return res.render('analysis/index', {
            results, standards, heatmap, year, currentYear
        })
    }
    catch (error) {
        next(error)
    }
}

exports.g_portfolio = async function (req, res) {
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


