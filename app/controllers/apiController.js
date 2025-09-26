const { getAssessmentsByFIPSID } = require('../models/assessmentModel');
const { getServiceStandardOutcomesByAssessmentID } = require('../models/standards');
const { getActionsForAssessmentID } = require('../models/actions');
const pool = require('../models/pool');

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

// GET /api/assessments/published/summary
exports.getPublishedAssessmentsSummary = async (req, res, next) => {
    try {
        // Get all published assessments with full details including user information
        const { rows } = await pool.query(`
            SELECT 
                a.*, 
                d."Name" as "DepartmentName",
                dd."FirstName" as "DDFirstName",
                dd."LastName" as "DDLastName", 
                dd."EmailAddress" as "DDEmail",
                pm."FirstName" as "PMFirstName",
                pm."LastName" as "PMLastName",
                pm."EmailAddress" as "PMEmail",
                dm."FirstName" as "DMFirstName",
                dm."LastName" as "DMLastName",
                dm."EmailAddress" as "DMEmail"
            FROM "Assessment" a
            INNER JOIN "Department" d ON a."Department" = d."DepartmentID"
            LEFT JOIN "User" dd ON a."DD" = dd."UserID"
            LEFT JOIN "User" pm ON a."PM" = pm."UserID"
            LEFT JOIN "User" dm ON a."DM" = dm."UserID"
            WHERE a."Status" = 'Published'
            ORDER BY a."AssessmentDateTime" DESC
        `);

        // Get additional data for each assessment (ratings and actions)
        const assessmentsWithData = await Promise.all(
            rows.map(async (assessment) => {
                const ratings = await getServiceStandardOutcomesByAssessmentID(assessment.AssessmentID);
                const actions = await getActionsForAssessmentID(assessment.AssessmentID);

                // Count actions per standard for this assessment
                const actionsByStandard = {};
                actions.forEach(action => {
                    const standard = action.Point;
                    actionsByStandard[standard] = (actionsByStandard[standard] || 0) + 1;
                });

                // Add ActionsCount to each rating
                const ratingsWithActionCount = ratings.map(rating => ({
                    Standard: rating.Standard,
                    Outcome: rating.Outcome,
                    ActionsCount: actionsByStandard[rating.Standard] || 0
                }));

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
                    DD: {
                        UserID: assessment.DD,
                        FirstName: assessment.DDFirstName,
                        LastName: assessment.DDLastName,
                        EmailAddress: assessment.DDEmail,
                        FullName: assessment.DDFirstName && assessment.DDLastName ? 
                            `${assessment.DDFirstName} ${assessment.DDLastName}` : null
                    },
                    PM: {
                        UserID: assessment.PM,
                        FirstName: assessment.PMFirstName,
                        LastName: assessment.PMLastName,
                        EmailAddress: assessment.PMEmail,
                        FullName: assessment.PMFirstName && assessment.PMLastName ? 
                            `${assessment.PMFirstName} ${assessment.PMLastName}` : null
                    },
                    DM: {
                        UserID: assessment.DM,
                        FirstName: assessment.DMFirstName,
                        LastName: assessment.DMLastName,
                        EmailAddress: assessment.DMEmail,
                        FullName: assessment.DMFirstName && assessment.DMLastName ? 
                            `${assessment.DMFirstName} ${assessment.DMLastName}` : null
                    },
                    SRO: assessment.SRO,
                    ratings: ratingsWithActionCount
                };
            })
        );

        // Create summaries
        const summaries = {
            totalAssessments: assessmentsWithData.length,
            byOutcome: {},
            byType: {},
            byPhase: {},
            byYear: {}
        };

        // Process each assessment to build summaries
        assessmentsWithData.forEach(assessment => {
            const outcome = assessment.Outcome || 'Unknown';
            const type = assessment.Type || 'Unknown';
            const phase = assessment.Phase || 'Unknown';
            const year = assessment.AssessmentDateTime ? new Date(assessment.AssessmentDateTime).getFullYear() : 'Unknown';

            // Count by outcome
            summaries.byOutcome[outcome] = (summaries.byOutcome[outcome] || 0) + 1;

            // Count by type
            summaries.byType[type] = (summaries.byType[type] || 0) + 1;

            // Count by phase
            summaries.byPhase[phase] = (summaries.byPhase[phase] || 0) + 1;

            // Count by year
            summaries.byYear[year] = (summaries.byYear[year] || 0) + 1;
        });

        res.json({
            summaries,
            assessments: assessmentsWithData,
            count: assessmentsWithData.length
        });
    } catch (error) {
        console.error('Error in getPublishedAssessmentsSummary:', error);
        next(error);
    }
};

// GET /api/assessments/published/actions-by-standard
exports.getActionsByStandardForPublished = async (req, res, next) => {
    try {
        // Get action counts by service standard for published assessments
        const { rows } = await pool.query(`
            SELECT 
                a."Point" as "Standard",
                COUNT(a."ActionID") as "ActionCount",
                COUNT(DISTINCT a."AssessmentID") as "AssessmentCount"
            FROM "Actions" a
            INNER JOIN "Assessment" ass ON a."AssessmentID" = ass."AssessmentID"
            WHERE ass."Status" = 'Published'
            GROUP BY a."Point"
            ORDER BY a."Point" ASC
        `);

        res.json({
            actionsByStandard: rows,
            totalStandards: rows.length
        });
    } catch (error) {
        console.error('Error in getActionsByStandardForPublished:', error);
        next(error);
    }
};

// GET /api/assessments/published/by-portfolio-dd
exports.getPublishedAssessmentsByPortfolioAndDD = async (req, res, next) => {
    try {
        // Get published assessments grouped by Portfolio and DD
        const { rows } = await pool.query(`
            SELECT 
                a."Portfolio",
                a."DD",
                u."FirstName" as "DDFirstName",
                u."LastName" as "DDLastName",
                COUNT(a."AssessmentID") as "AssessmentCount",
                ARRAY_AGG(
                    JSON_BUILD_OBJECT(
                        'AssessmentID', a."AssessmentID",
                        'Name', a."Name",
                        'Type', a."Type",
                        'Phase', a."Phase",
                        'Outcome', a."Outcome",
                        'AssessmentDateTime', a."AssessmentDateTime"
                    ) ORDER BY a."AssessmentDateTime" DESC
                ) as "Assessments"
            FROM "Assessment" a
            LEFT JOIN "User" u ON a."DD" = u."UserID"
            WHERE a."Status" = 'Published'
            GROUP BY a."Portfolio", a."DD", u."FirstName", u."LastName"
            ORDER BY a."Portfolio" ASC, u."LastName" ASC, u."FirstName" ASC
        `);

        res.json({
            assessmentsByPortfolioAndDD: rows,
            totalGroups: rows.length
        });
    } catch (error) {
        console.error('Error in getPublishedAssessmentsByPortfolioAndDD:', error);
        next(error);
    }
};

// Export the authentication middleware for use in routes
exports.authenticateApiToken = authenticateApiToken;
