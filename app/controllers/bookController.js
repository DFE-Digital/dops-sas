/**
 * 
 * Manages the book routes
 */
const { check, validationResult } = require('express-validator');
const { AssessmentModel, createAssessment, getAssessmentById, updateAssessment, getDraftsForUser, deleteAssessment } = require('../models/assessmentModel');
const { validatePhase, validateType, validateName, validateDescription, validateCode, validateDate, validateEndDate, validateEndDates, validatePortfolio, validateDD, validatePM, validateDM } = require('../validation/book');
const { UpsertUserNoToken, getBasicUserDetails } = require('../models/user');
const { getDates } = require('../utils/utils');
const { sendNotifyEmail } = require('../middleware/notify');

function removeSpecificSessionDataKeys(req) {
    const keysToRemove = [
        "Name", "Type", "Description", "ProjectCode", "ProjectCodeYN",
        "Day", "Month", "Year", "Phase", "EndDay", "EndMonth", "EndYear",
        "EndDateYN", "ReviewWeek", "Portfolio", "ddemail", "ddfirstName",
        "ddlastName", "pmemail", "pmfirstName", "pmlastName", "pm",
        "dmemail", "dmfirstName", "dmlastName", "dm", "AssessmentID",
        "description", "name"
    ];

    keysToRemove.forEach(key => {
        delete req.session.data[key];
    });
}

exports.g_start = async function (req, res) {
    req.session.data.model = {};
    removeSpecificSessionDataKeys(req);

    req.session.data.AssessmentID = undefined;
    const userID = req.session.data.User.UserID;

    const drafts = await getDraftsForUser(userID);

    return res.render('book/index', { drafts: drafts });
}

exports.g_getdraft = async function (req, res) {
    const { assessmentID } = req.params;
    const draftData = await getAssessmentById(assessmentID);
    req.session.data.AssessmentID = assessmentID;
    req.session.data.model = draftData;

    return res.render('book/request/tasks', { model: draftData });
}



exports.g_phase = async function (req, res) {


    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/phase', { model: model });
    } else {
        return res.render('book/request/phase');
    }
};

exports.g_type = async function (req, res) {
    if (!req.session.data) {
        return res.render('book/index');
    }

    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/type', { model: model });
    } else {
        return res.redirect('/book');
    }
};

exports.g_name = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/name', { model: model });
    } else {
        return res.redirect('/book');
    }
};

exports.g_description = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/description', { model: model });
    } else {
        return res.redirect('/book');
    }
};

exports.g_code = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/code', { model: model });
    } else {
        return res.redirect('/book');
    }
};

exports.g_startdate = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/start-date', { model: model });
    } else {
        return res.redirect('/book');
    }
};

exports.g_enddate = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/end-date', { model: model });
    } else {
        return res.redirect('/book');
    }
};

exports.g_dates = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);

        let endDateEstimated = undefined
        // if theres an end date, use that, otherwise, we just want the weeks between weeks 5 and 12 ahead

        if (model.EndDateYN === 'Yes') {
            endDateEstimated = new Date(model.EndDate)
        }

        let dates = getDates(5, 12, endDateEstimated);

        return res.render('book/request/dates', { model: model, hasdates: dates.length ? 'Yes' : 'No', dates: dates });
    } else {
        return res.redirect('/book');
    }
};

exports.g_portfolio = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/portfolio', { model: model });
    } else {
        return res.redirect('/book');
    }
};

exports.g_dd = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);

        let userDetails = ""

        if (model.DD) {
            userDetails = await getBasicUserDetails(model.DD);
        }

        return res.render('book/request/dd', { model: model, userDetails });
    } else {
        return res.redirect('/book');
    }
};

exports.g_product = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        let userDetails = ""

        if (model.PM) {
            userDetails = await getBasicUserDetails(model.PM);
        }

        return res.render('book/request/product', { model: model, userDetails });
    } else {
        return res.redirect('/book');
    }
};

exports.g_delivery = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        let userDetails = ""

        if (model.DM) {
            userDetails = await getBasicUserDetails(model.DM);
        }

        return res.render('book/request/delivery', { model: model, userDetails });
    } else {
        return res.redirect('/book');
    }
};

exports.g_tasks = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/tasks', { model: model });
    } else {
        return res.redirect('/book');
    }
};


exports.g_delete = async function (req, res) {
    const assessmentID = req.session.data.AssessmentID;
    if (assessmentID) {
        const model = await getAssessmentById(assessmentID);
        return res.render('book/request/confirm-delete', { model: model });
    } else {
        return res.redirect('/book');
    }
};


exports.g_deleted = async function (req, res) {

    req.session.data.model = {};
    req.body = {}

    return res.render('book/deleted');
};

exports.g_submitted = async function (req, res) {

    req.session.data.model = {};
    req.body = {}

    return res.render('book/submitted');
};

// POSTS

exports.p_phase = [
    validatePhase,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/phase', {
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            model = new AssessmentModel({
                Phase: req.body.Phase,
                Status: 'Draft',
                Outcome: 'Not rated',
                CreatedBy: userID,
                CreatedDate: new Date(),
                Department: req.session.data.User.Department
            });

            assessmentID = await createAssessment(model, userID);

        } else {
            model = await getAssessmentById(assessmentID);

            model.Phase = req.body.Phase;

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/type');

    }
];

exports.p_type = [
    validateType,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/type', {
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            if (model.Phase === 'Discovery') {
                model.Type = 'Peer review';
            } else {
                model.Type = 'Service assessment';
            }

            //model.Type = req.body.Type;

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/name');

    }
];


exports.p_name = [
    validateName,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/name', {
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            model.Name = req.body.Name;

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/description');

    }
];

exports.p_description = [
    validateDescription,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/description', {
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            model.Description = req.body.Description;

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/code');

    }
];

exports.p_code = [
    validateCode,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/code', {
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            model.ProjectCodeYN = req.body.ProjectCodeYN;
            model.ProjectCode = req.body.ProjectCode;


            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/start-date');

    }
];

exports.p_startdate = [
    validateDate, // Make sure this validation properly validates Day, Month, and Year
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/start-date', {
                errors: errors.array(),
                model: req.body, // Pass back the form data for user convenience
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, AssessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {
            return res.redirect('/book');
        } else {
            model = await getAssessmentById(assessmentID);

            if (req.body.Day && req.body.Month && req.body.Year) {
                // Correcting for timezone offset by using Date.UTC
                let day = parseInt(req.body.Day, 10);
                let month = parseInt(req.body.Month, 10) - 1; // Months are 0-indexed
                let year = parseInt(req.body.Year, 10);

                let date = new Date(Date.UTC(year, month, day));

                model.StartDate = date.toISOString().split('T')[0]; // Store as YYYY-MM-DD format
            }

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model to the updated values
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/end-date');
    }
];


exports.p_enddate = [
    validateEndDate,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/end-date', {
                errors: errors.array(),
                model: req.body, // Pass back the form data for user convenience
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);
        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {
            return res.redirect('/book');
        } else {
            model = await getAssessmentById(assessmentID);

            if (req.body.EndDateYN === 'Yes') {
                let day = parseInt(req.body.EndDay, 10);
                let month = parseInt(req.body.EndMonth, 10) - 1; // Months are 0-indexed
                let year = parseInt(req.body.EndYear, 10);

                // Construct the date in UTC to avoid timezone shifts
                let date = new Date(Date.UTC(year, month, day));

                model.EndDateYN = req.body.EndDateYN;
                model.EndDate = date.toISOString().split('T')[0]; // Store as YYYY-MM-DD format
            } else {
                // Handle the case when no end date is specified
                model.EndDateYN = 'No';
                model.EndDate = null;
            }

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/dates');
    }
];


exports.p_dates = [
    validateEndDates,
    async (req, res) => {
        const errors = validationResult(req);


        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;


        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        if (!errors.isEmpty()) {

            let endDateEstimated = undefined

            model = await getAssessmentById(assessmentID);
            // if theres an end date, use that, otherwise, we just want the weeks between weeks 5 and 12 ahead

            if (model.EndDateYN === 'Yes') {
                endDateEstimated = new Date(model.EndDate)
            }

            let dates = getDates(5, 12, endDateEstimated);

            return res.render('book/request/dates', {
                errors: errors.array(),
                model: req.body, hasdates: dates.length ? 'Yes' : 'No', dates: dates
            });
        }

        if (!assessmentID) {
            return res.redirect('/book');
        } else {
            model = await getAssessmentById(assessmentID);

            let requestedWeeks = '';

            requestedWeeks = req.body.ReviewWeek
                ? req.body.ReviewWeek.toString()
                : 'None available as end date is within next 5 weeks'


            model.RequestedWeeks = requestedWeeks;


            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/portfolio');
    }
];


exports.p_portfolio = [
    validatePortfolio,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/portfolio', {
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            model.Portfolio = req.body.Portfolio;

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/dd');

    }
];

exports.p_dd = [
    validateDD,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('book/request/dd', {
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            let ddUserID = await UpsertUserNoToken(req.body.ddemail, userID, 'Book request: ' + assessmentID);
            model.DD = ddUserID;

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/product');

    }
];

exports.p_product = [
    validatePM,
    async (req, res) => {
        const errors = validationResult(req);

        let tempModel = new AssessmentModel(req.body);
        tempModel.PMYN = req.body.pm;

        if (!errors.isEmpty()) {
            return res.render('book/request/product', {
                model: tempModel,
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            if (req.body.pm === "Yes") {
                let pmUserID = await UpsertUserNoToken(req.body.pmemail, "", "", userID, 'Book request: ' + assessmentID);
                model.PM = pmUserID;
                model.PMYN = "Yes";
            }
            else {
                model.PM = null;
                model.PMYN = "No";
            }

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/delivery');

    }
];


exports.p_delivery = [
    validateDM,
    async (req, res) => {
        const errors = validationResult(req);

        let tempModel = new AssessmentModel(req.body);
        tempModel.DMYN = req.body.dm;

        if (!errors.isEmpty()) {
            return res.render('book/request/delivery', {
                model: tempModel,
                errors: errors.array()
            });
        }

        const modelData = req.session.data && req.session.data.AssessmentID
            ? { ...req.body, assessmentID: req.session.data.AssessmentID }
            : req.body;

        let model = new AssessmentModel(modelData);

        const userID = req.session.data.User.UserID;
        let assessmentID = req.session.data.AssessmentID;

        if (!assessmentID) {

            return res.redirect('/book');

        } else {
            model = await getAssessmentById(assessmentID);

            if (req.body.dm === "Yes") {
                let dmUserID = await UpsertUserNoToken(req.body.dmemail, "", "", userID, 'Book request: ' + assessmentID);
                model.DM = dmUserID;
                model.DMYN = "Yes";
            }
            else {
                model.DM = null;
                model.DMYN = "No";
            }

            // Update existing assessment
            await updateAssessment(assessmentID, model, userID);
        }

        // Reset the model 
        model = await getAssessmentById(assessmentID);

        req.session.data.AssessmentID = model.AssessmentID;
        req.session.data.model = model;

        return res.redirect('/book/request/tasks');

    }
];


exports.p_submit = async function (req, res) {

    const userID = req.session.data.User.UserID;
    let assessmentID = req.session.data.AssessmentID;

    let model = await getAssessmentById(assessmentID);

    model.Status = 'New';

    await updateAssessment(assessmentID, model, userID);

    // Send email to DD, PM and DM

    // Get basic user details
    let ddDetails = await getBasicUserDetails(model.DD);
    let pmDetails = await getBasicUserDetails(model.PM);
    let dmDetails = await getBasicUserDetails(model.DM);
    let user = await getBasicUserDetails(model.CreatedBy);

    const templateParams = {
        phase: model.Phase.toLowerCase(),
        type: model.Type.toLowerCase(),
        name: model.Name,
        summary: model.Description,
        serviceURL: process.env.serviceURL,
        id: model.AssessmentID.toString()

    };

    // Send email to user
    sendNotifyEmail(process.env.email_BookSubmission, user.EmailAddress, templateParams);

    // Send email to DD
    sendNotifyEmail(process.env.email_BookSubmission, ddDetails.EmailAddress, templateParams);

    if (pmDetails && pmDetails.EmailAddress) {
        if (user.EmailAddress !== pmDetails.EmailAddress) {
            // Send email to PM
            sendNotifyEmail(process.env.email_BookSubmission, pmDetails.EmailAddress, templateParams);
        }
    }

    if (dmDetails && dmDetails.EmailAddress) {
        if (user.EmailAddress !== dmDetails.EmailAddress) {
            // Send email to DM
            sendNotifyEmail(process.env.email_BookSubmission, dmDetails.EmailAddress, templateParams);
        }
    }

    // Send email to SA+ team for a new booking
    sendNotifyEmail(process.env.email_SANewBooking, process.env.saPlusEmail, templateParams);

    req.session.data.model = {};

    // clear all the req.body items
    req.session.data.description = "";
    req.session.data.name = "";

    removeSpecificSessionDataKeys(req);

    return res.redirect('/book/submitted');

}

exports.p_confirmdelete = async function (req, res) {
    const userID = req.session.data.User.UserID;
    let assessmentID = req.session.data.AssessmentID;

    model = await getAssessmentById(assessmentID);

    if (model.CreatedBy !== userID) {
        return res.redirect('/auth/sign-out');
    } else {
        try {
            let result = await deleteAssessment(assessmentID, userID);

            req.session.data.model = {};
            req.session.data.AssessmentID = undefined;
            removeSpecificSessionDataKeys(req);

            return res.redirect('/book/deleted');

        } catch (error) {
            console.error('Error in post_book_confirm_delete:', error);
            return res.redirect('/book/request/error');
        }
    }
}

