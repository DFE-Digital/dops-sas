/**
 * Author:          Andy Jones - Department for Education
 * Description:     Handles session in the service
 * GitHub Issue:
 */


// Middleware to save form data to session
function saveFormDataToSession(req, res, next) {
    if (req.method === 'POST') {
        req.session.data = {
            ...req.session.data, // Existing session data
            ...req.body // New form data
        };
    }
    next();
}

// Middleware to make form data available globally
function makeFormDataGlobal(req, res, next) {
    res.locals.data = {
        ...res.locals.data, // Existing data
        ...req.session.data // Data from the session
    };
    next();
}

module.exports = {
    saveFormDataToSession,
    makeFormDataGlobal
};