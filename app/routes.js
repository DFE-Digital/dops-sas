const express = require('express');
const router = express.Router();

const { getRolesByUserID } = require('./models/userrole');

const publicController = require('./controllers/publicController');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const bookController = require('./controllers/bookController');
const manageController = require('./controllers/manageController');
const serviceAdminController = require('./controllers/serviceAdminController');

const rolesToCheck = ['Department Lead', 'Administrator', 'Service Administrator'];


/**
 * Check routes that the user needs to be authenticated to access
 * */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.UserId && req.session.data.User) {
        return next();
    } else {
        return res.redirect('/sign-in');
    }
}

/**
 * Validates a route that only an admin should be able to access
 */
async function isAdmin(req, res, next) {

    if (req.session && req.session.UserId && req.session.data.User) {
        const userID = parseInt(req.session.data.User.UserID)
        const userRoles = await getRolesByUserID(userID)
        const userRolesList = userRoles.map(role => role.UserRole);

        if (userRolesList.some(role => rolesToCheck.includes(role))) {
            return next();
        } else {
            return res.redirect('/admin');
        }
    } else {
        return res.redirect('/sign-out');
    }
}



router.get('/', publicController.g_home);
router.get('/features', publicController.g_features);
router.get('/contact', publicController.g_contact);


// Auth routes
router.get('/sign-in', authController.g_signin);
router.get('/auth/t/:token', authController.g_checktoken);
router.get('/sign-out', authController.g_signout);
router.get('/check-email', authController.g_checkemail);

router.post('/sign-in', authController.p_signin);


// Book routes
router.get('/book', isAuthenticated, bookController.g_start);
router.get("/book/draft/:assessmentID", isAuthenticated, bookController.g_getdraft);
router.get('/book/request/phase', bookController.g_phase);
router.get('/book/request/type', bookController.g_type);
router.get("/book/request/name", isAuthenticated, bookController.g_name);
router.get("/book/request/description", isAuthenticated, bookController.g_description);
router.get("/book/request/code", isAuthenticated, bookController.g_code);
router.get("/book/request/start-date", isAuthenticated, bookController.g_startdate);
router.get("/book/request/end-date", isAuthenticated, bookController.g_enddate);
router.get("/book/request/dates", isAuthenticated, bookController.g_dates);
router.get("/book/request/portfolio", isAuthenticated, bookController.g_portfolio);
router.get("/book/request/dd", isAuthenticated, bookController.g_dd);
router.get("/book/request/product", isAuthenticated, bookController.g_product);
router.get("/book/request/delivery", isAuthenticated, bookController.g_delivery);
router.get("/book/request/tasks", isAuthenticated, bookController.g_tasks);
router.get("/book/request/delete", isAuthenticated, bookController.g_delete);
router.get("/book/deleted", isAuthenticated, bookController.g_deleted);
router.get("/book/submitted", isAuthenticated, bookController.g_submitted);

// Posts
router.post('/book/request/phase', bookController.p_phase);
router.post('/book/request/type', bookController.p_type);
router.post("/book/request/name", isAuthenticated, bookController.p_name);
router.post("/book/request/description", isAuthenticated, bookController.p_description);
router.post("/book/request/code", isAuthenticated, bookController.p_code);
router.post("/book/request/start-date", isAuthenticated, bookController.p_startdate);
router.post("/book/request/end-date", isAuthenticated, bookController.p_enddate);
router.post("/book/request/dates", isAuthenticated, bookController.p_dates);
router.post("/book/request/portfolio", isAuthenticated, bookController.p_portfolio);
router.post("/book/request/dd", isAuthenticated, bookController.p_dd);
router.post("/book/request/product", isAuthenticated, bookController.p_product);
router.post("/book/request/delivery", isAuthenticated, bookController.p_delivery);
router.post("/book/request/submit", isAuthenticated, bookController.p_submit);
router.post("/book/request/confirm-delete", isAuthenticated, bookController.p_confirmdelete);


// Manage routes
router.get('/manage', isAuthenticated, manageController.g_manage);
router.get("/manage/overview/:assessmentID", isAuthenticated, manageController.g_overview);



// Admin routes
router.get('/admin', isAuthenticated, isAdmin, adminController.g_index);
router.get("/admin/overview/:assessmentID", isAuthenticated, isAdmin, adminController.g_overview);
router.get("/admin/process/:assessmentID", isAuthenticated, isAdmin, adminController.g_process);
router.get("/admin/request/:assessmentID", isAuthenticated, isAdmin, adminController.g_process);
router.get("/admin/panel/:assessmentID", isAuthenticated, isAdmin, adminController.g_panel);
router.get("/admin/add-panel/:assessmentID", isAuthenticated, isAdmin, adminController.g_addpanel);
router.get("/admin/remove-panel/:assessmentPanelID/:uniqueID", isAuthenticated, isAdmin, adminController.g_removepanel);
router.get("/admin/add-date/:assessmentID", isAuthenticated, isAdmin, adminController.g_adddate);
router.get("/admin/assessments", isAuthenticated, isAdmin, adminController.g_assessments);
router.get("/admin/assessors", isAuthenticated, isAdmin, adminController.g_assessors);
router.get("/admin/add-assessor", isAuthenticated, isAdmin, adminController.g_addassessor);
router.get("/admin/report/:assessmentID", isAuthenticated, isAdmin, adminController.g_report);



router.post("/admin/process/", isAuthenticated, isAdmin, adminController.p_process);
router.post("/admin/add-panel/", isAuthenticated, isAdmin, adminController.p_addpanel);
router.post("/admin/remove-panel/", isAuthenticated, isAdmin, adminController.p_removepanel);
router.post("/admin/add-date", isAuthenticated, isAdmin, adminController.p_adddate);
router.post("/admin/add-assessor", isAuthenticated, isAdmin, adminController.p_addassessor);



// Service Admin routes
router.get('/service-admin/create-department', isAuthenticated, serviceAdminController.g_createDepartment);
router.post('/service-admin/create-department', isAuthenticated, serviceAdminController.p_createDepartment);

module.exports = router;
