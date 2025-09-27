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

        // Get service standards to get titles (once for all assessments)
        const { rows: standards } = await pool.query(`
            SELECT "Point", "Title"
            FROM "ServiceStandards"
            ORDER BY "Point" ASC
        `);
        
        // Create a lookup map for standard titles
        const standardTitles = {};
        standards.forEach(standard => {
            standardTitles[standard.Point] = standard.Title;
        });

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

                // Add ActionsCount and Title to each rating, then sort by standard number
                const ratingsWithActionCount = ratings.map(rating => ({
                    Standard: rating.Standard,
                    Title: standardTitles[rating.Standard] || null,
                    Outcome: rating.Outcome,
                    ActionsCount: actionsByStandard[rating.Standard] || 0
                })).sort((a, b) => {
                    // Sort by standard number
                    return a.Standard - b.Standard;
                });

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

// GET /api/assessments/{assessmentID}/actions
exports.getActionsByAssessmentId = async (req, res, next) => {
    try {
        const { assessmentID } = req.params;

        if (!assessmentID || isNaN(parseInt(assessmentID, 10))) {
            return res.status(400).json({ error: 'Valid assessment ID is required' });
        }

        // Get actions for the assessment
        const actions = await getActionsForAssessmentID(parseInt(assessmentID, 10));

        // Get service standards to get titles
        const { rows: standards } = await pool.query(`
            SELECT "Point", "Title"
            FROM "ServiceStandards"
            ORDER BY "Point" ASC
        `);
        
        // Create a lookup map for standard titles
        const standardTitles = {};
        standards.forEach(standard => {
            standardTitles[standard.Point] = standard.Title;
        });

        // Get ratings for the assessment to get standard outcomes
        const ratings = await getServiceStandardOutcomesByAssessmentID(parseInt(assessmentID, 10));
        
        // Create a lookup map for standard outcomes
        const standardOutcomes = {};
        ratings.forEach(rating => {
            standardOutcomes[rating.Standard] = rating.Outcome;
        });

        // Enhance actions with standard titles and outcomes
        const actionsWithDetails = actions.map(action => ({
            ActionID: action.ActionID,
            AssessmentID: action.AssessmentID,
            Standard: action.Point,
            StandardTitle: standardTitles[action.Point] || null,
            StandardOutcome: standardOutcomes[action.Point] || null,
            Comments: action.Comments,
            Status: action.Status,
            CreatedBy: action.CreatedBy,
            Created: action.Created,
            AssignedTo: action.AssignedTo,
            UniqueID: action.UniqueID,
            EstimatedResolutionDate: action.EstimatedResolutionDate
        }));

        // Group actions by standard
        const actionsByStandard = {};
        actionsWithDetails.forEach(action => {
            const standard = action.Standard;
            if (!actionsByStandard[standard]) {
                actionsByStandard[standard] = {
                    Standard: standard,
                    StandardTitle: action.StandardTitle,
                    StandardOutcome: action.StandardOutcome,
                    Actions: []
                };
            }
            actionsByStandard[standard].Actions.push(action);
        });

        // Convert to array and sort by standard number
        const groupedActions = Object.values(actionsByStandard).sort((a, b) => a.Standard - b.Standard);

        res.json({
            assessmentID: parseInt(assessmentID, 10),
            actionsByStandard: groupedActions,
            totalActions: actionsWithDetails.length,
            totalStandards: groupedActions.length
        });
    } catch (error) {
        console.error('Error in getActionsByAssessmentId:', error);
        next(error);
    }
};

// GET /api/assessments/actions/all
exports.getAllActionsGroupedByAssessment = async (req, res, next) => {
    try {
        // Get all actions from all assessments
        const { rows: actions } = await pool.query(`
            SELECT a.*, ass."Name" as "AssessmentName", ass."Status" as "AssessmentStatus", 
                   ass."Type" as "AssessmentType", ass."Outcome" as "AssessmentOutcome", 
                   ass."Phase" as "AssessmentPhase"
            FROM "Actions" a
            INNER JOIN "Assessment" ass ON a."AssessmentID" = ass."AssessmentID"
            ORDER BY a."AssessmentID" ASC, a."Point" ASC
        `);

        // Get service standards to get titles
        const { rows: standards } = await pool.query(`
            SELECT "Point", "Title"
            FROM "ServiceStandards"
            ORDER BY "Point" ASC
        `);
        
        // Create a lookup map for standard titles
        const standardTitles = {};
        standards.forEach(standard => {
            standardTitles[standard.Point] = standard.Title;
        });

        // Get all ratings to get standard outcomes for all assessments
        const { rows: ratings } = await pool.query(`
            SELECT "AssessmentID", "Standard", "Outcome"
            FROM "ServiceStandardOutcomes"
            ORDER BY "AssessmentID" ASC, "Standard" ASC
        `);
        
        // Create a lookup map for standard outcomes by assessment
        const standardOutcomes = {};
        ratings.forEach(rating => {
            if (!standardOutcomes[rating.AssessmentID]) {
                standardOutcomes[rating.AssessmentID] = {};
            }
            standardOutcomes[rating.AssessmentID][rating.Standard] = rating.Outcome;
        });

        // Group actions by assessment, then by standard
        const actionsByAssessment = {};
        
        actions.forEach(action => {
            const assessmentID = action.AssessmentID;
            const standard = action.Point;
            
            // Initialize assessment if not exists
            if (!actionsByAssessment[assessmentID]) {
                actionsByAssessment[assessmentID] = {
                    AssessmentID: assessmentID,
                    AssessmentName: action.AssessmentName,
                    AssessmentStatus: action.AssessmentStatus,
                    AssessmentType: action.AssessmentType,
                    AssessmentOutcome: action.AssessmentOutcome,
                    AssessmentPhase: action.AssessmentPhase,
                    ActionsByStandard: {}
                };
            }
            
            // Initialize standard if not exists
            if (!actionsByAssessment[assessmentID].ActionsByStandard[standard]) {
                actionsByAssessment[assessmentID].ActionsByStandard[standard] = {
                    Standard: standard,
                    StandardTitle: standardTitles[standard] || null,
                    StandardOutcome: standardOutcomes[assessmentID]?.[standard] || null,
                    Actions: []
                };
            }
            
            // Add action to the appropriate group
            actionsByAssessment[assessmentID].ActionsByStandard[standard].Actions.push({
                ActionID: action.ActionID,
                AssessmentID: action.AssessmentID,
                Standard: action.Point,
                StandardTitle: standardTitles[action.Point] || null,
                StandardOutcome: standardOutcomes[assessmentID]?.[action.Point] || null,
                Comments: action.Comments,
                Status: action.Status,
                CreatedBy: action.CreatedBy,
                Created: action.Created,
                AssignedTo: action.AssignedTo,
                UniqueID: action.UniqueID,
                EstimatedResolutionDate: action.EstimatedResolutionDate
            });
        });

        // Convert to array format and sort
        const result = Object.values(actionsByAssessment).map(assessment => ({
            AssessmentID: assessment.AssessmentID,
            AssessmentName: assessment.AssessmentName,
            AssessmentStatus: assessment.AssessmentStatus,
            AssessmentType: assessment.AssessmentType,
            AssessmentOutcome: assessment.AssessmentOutcome,
            AssessmentPhase: assessment.AssessmentPhase,
            ActionsByStandard: Object.values(assessment.ActionsByStandard).sort((a, b) => a.Standard - b.Standard)
        })).sort((a, b) => a.AssessmentID - b.AssessmentID);

        // Calculate totals
        const totalActions = actions.length;
        const totalAssessments = result.length;
        const totalStandards = new Set(actions.map(a => a.Point)).size;

        res.json({
            assessments: result,
            summary: {
                totalActions,
                totalAssessments,
                totalStandards
            }
        });
    } catch (error) {
        console.error('Error in getAllActionsGroupedByAssessment:', error);
        next(error);
    }
};

// PUT /api/assessments/{assessmentID}/fips-id
exports.updateAssessmentFipsId = async (req, res, next) => {
    try {
        const { assessmentID } = req.params;
        const { fips_id } = req.body;

        // Validate assessment ID
        if (!assessmentID || isNaN(parseInt(assessmentID, 10))) {
            return res.status(400).json({ error: 'Valid assessment ID is required' });
        }

        // Validate FIPS ID
        if (!fips_id || typeof fips_id !== 'string' || fips_id.trim() === '') {
            return res.status(400).json({ error: 'FIPS ID is required and must be a non-empty string' });
        }

        const assessmentIdNum = parseInt(assessmentID, 10);
        const trimmedFipsId = fips_id.trim();

        // Check if assessment exists
        const { rows: existingAssessment } = await pool.query(`
            SELECT "AssessmentID", "FIPS_ID", "Name", "Status"
            FROM "Assessment"
            WHERE "AssessmentID" = $1
        `, [assessmentIdNum]);

        if (existingAssessment.length === 0) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        // Note: FIPS ID is not unique - multiple assessments can share the same FIPS ID
        // as it represents a product identifier and products can have multiple assessments

        // Update the assessment with the new FIPS ID
        const { rows: updatedAssessment } = await pool.query(`
            UPDATE "Assessment"
            SET "FIPS_ID" = $2
            WHERE "AssessmentID" = $1
            RETURNING "AssessmentID", "FIPS_ID", "Name", "Status", "Department"
        `, [assessmentIdNum, trimmedFipsId]);

        res.json({
            success: true,
            message: 'FIPS ID updated successfully',
            assessment: updatedAssessment[0]
        });
    } catch (error) {
        console.error('Error in updateAssessmentFipsId:', error);
        next(error);
    }
};

// Export the authentication middleware for use in routes
exports.authenticateApiToken = authenticateApiToken;
