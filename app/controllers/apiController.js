const { getAssessmentsByFIPSID } = require('../models/assessmentModel');
const { getServiceStandardOutcomesByAssessmentID } = require('../models/standards');
const { getActionsForAssessmentID } = require('../models/actions');

// Middleware to authenticate API requests using FIPSPK_TOKEN
function authenticateApiToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-key'];
    const expectedToken = process.env.FIPSPK_TOKEN;

    if (!expectedToken) {
        console.error('FIPSPK_TOKEN environment variable not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!token || token !== expectedToken) {
        return res.status(401).json({ error: 'Unauthorized - invalid or missing token' });
    }

    next();
}

// GET /api/product/{FIPS_ID}
exports.getProductByFipsId = async (req, res, next) => {
    try {
        const { fips_id } = req.params;

        if (!fips_id) {
            return res.status(400).json({ error: 'FIPS ID is required' });
        }

        // Get all assessments with the given FIPS ID
        const assessments = await getAssessmentsByFIPSID(fips_id);

        if (!assessments || assessments.length === 0) {
            return res.status(404).json({ error: 'No assessments found for the provided FIPS ID' });
        }

        // Get additional data for each assessment
        const assessmentsWithData = await Promise.all(
            assessments.map(async (assessment) => {
                const ratings = await getServiceStandardOutcomesByAssessmentID(assessment.AssessmentID);
                const actions = await getActionsForAssessmentID(assessment.AssessmentID);

                return {
                    AssessmentID: assessment.AssessmentID,
                    FIPS_ID: assessment.FIPS_ID,
                    Name: assessment.Name,
                    Description: assessment.Description,
                    Type: assessment.Type,
                    Phase: assessment.Phase,
                    Status: assessment.Status,
                    Outcome: assessment.Outcome,
                    ProjectCode: assessment.ProjectCode,
                    Portfolio: assessment.Portfolio,
                    StartDate: assessment.StartDate,
                    EndDate: assessment.EndDate,
                    AssessmentDateTime: assessment.AssessmentDateTime,
                    AssessmentTime: assessment.AssessmentTime,
                    Department: assessment.Department,
                    DepartmentName: assessment.DepartmentName,
                    CreatedDate: assessment.CreatedDate,
                    PanelComments: assessment.PanelComments,
                    PanelCommentsComplete: assessment.PanelCommentsComplete,
                    PanelCommentsImprove: assessment.PanelCommentsImprove,
                    ratings: ratings,
                    actions: actions
                };
            })
        );

        res.json({
            fips_id: fips_id,
            assessments: assessmentsWithData,
            count: assessmentsWithData.length
        });
    } catch (error) {
        console.error('Error in getProductByFipsId:', error);
        next(error);
    }
};

// Export the authentication middleware for use in routes
exports.authenticateApiToken = authenticateApiToken;
