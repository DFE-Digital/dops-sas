const express = require('express');
const router = express.Router();

const { getRolesByUserID } = require('./models/userrole');

const publicController = require('./controllers/publicController');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const bookController = require('./controllers/bookController');
const manageController = require('./controllers/manageController');
const serviceAdminController = require('./controllers/serviceAdminController');
const analysisController = require('./controllers/analysisController');
const reportsController = require('./controllers/reportsController');
const assessController = require('./controllers/assessController');
const profileController = require('./controllers/profileController');

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
router.get('/support', publicController.g_contact);
router.get('/accessibility', publicController.g_accessibility);
router.get('/privacy', publicController.g_privacy);
router.get('/cookies', publicController.g_cookies);

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
router.get("/manage/previous", isAuthenticated, manageController.g_previous);
router.get("/manage/overview/:assessmentID", isAuthenticated, manageController.g_overview);
router.get("/manage/panel/:assessmentID", isAuthenticated, manageController.g_panel);
router.get("/manage/request/:assessmentID", isAuthenticated, manageController.g_request);
router.get("/manage/report/:assessmentID", isAuthenticated, manageController.g_report);
router.get("/manage/artefacts/:assessmentID", isAuthenticated, manageController.g_artefacts);
router.get("/manage/team/:assessmentID", isAuthenticated, manageController.g_team);
router.get("/manage/add-artefact/:assessmentID", isAuthenticated, manageController.g_addartefact);
router.get("/manage/remove-artefact/:artefactID/:uniqueID", isAuthenticated, manageController.g_removeartefact);
router.get("/manage/add-team/:assessmentID", isAuthenticated, manageController.g_addteam);
router.get("/manage/remove-team/:teamID/:uniqueID", isAuthenticated, manageController.g_removeteam);

router.post("/manage/add-artefact", isAuthenticated, manageController.p_addartefact);
router.post("/manage/remove-artefact", isAuthenticated, manageController.p_removeartefact);
router.post("/manage/add-team", isAuthenticated, manageController.p_addteam);
router.post("/manage/remove-team", isAuthenticated, manageController.p_removeteam);
router.post("/manage/accept-report", isAuthenticated, manageController.p_acceptReport);

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
router.get("/admin/assessor/:assessorID", isAuthenticated, isAdmin, adminController.g_assessor);
router.get("/admin/add-assessor", isAuthenticated, isAdmin, adminController.g_addassessor);
router.get("/admin/report/:assessmentID", isAuthenticated, isAdmin, adminController.g_report);
router.get("/admin/artefacts/:assessmentID", isAuthenticated, isAdmin, adminController.g_artefacts);
router.get("/admin/team/:assessmentID", isAuthenticated, isAdmin, adminController.g_team);
router.get("/admin/reporting", isAuthenticated, isAdmin, adminController.g_reporting);
router.get("/admin/reporting/assessments", isAuthenticated, isAdmin, adminController.g_reportingAssessmentsAndPanels);
router.get("/admin/admins", isAuthenticated, isAdmin, adminController.g_admins);
router.get("/admin/add-admin", isAuthenticated, isAdmin, adminController.g_addadmin);
router.get("/admin/remove-admin/:userRoleID", isAuthenticated, isAdmin, adminController.g_removeadmin);

router.post("/admin/process/", isAuthenticated, isAdmin, adminController.p_process);
router.post("/admin/add-panel/", isAuthenticated, isAdmin, adminController.p_addpanel);
router.post("/admin/remove-panel/", isAuthenticated, isAdmin, adminController.p_removepanel);
router.post("/admin/add-date", isAuthenticated, isAdmin, adminController.p_adddate);
router.post("/admin/add-assessor", isAuthenticated, isAdmin, adminController.p_addassessor);
router.post("/admin/send-report", isAuthenticated, isAdmin, adminController.p_sendReport);
router.post("/admin/publish-report", isAuthenticated, isAdmin, adminController.p_publishReport);
router.post("/admin/add-admin", isAuthenticated, isAdmin, adminController.p_addadmin);
router.post("/admin/remove-admin", isAuthenticated, isAdmin, adminController.p_removeadmin);

// ANALYSIS ROUTES
router.get('/analysis', isAuthenticated, analysisController.g_index);
router.get('/analysis/portfolio/:name', isAuthenticated, analysisController.g_portfolio);

// ASSESS ROUTES
router.get('/assess', isAuthenticated, assessController.g_index);
router.get('/assess/previous', isAuthenticated, assessController.g_previous);
router.get("/assess/overview/:assessmentID", isAuthenticated, assessController.g_overview);
router.get("/assess/report/:assessmentID", isAuthenticated, assessController.g_report);
router.get("/assess/panel/:assessmentID", isAuthenticated, assessController.g_panel);
router.get("/assess/artefacts/:assessmentID", isAuthenticated, assessController.g_artefacts);
router.get("/assess/team/:assessmentID", isAuthenticated, assessController.g_team);
router.get("/assess/report-rating/:assessmentID", isAuthenticated, assessController.g_reportRating);
router.get("/assess/report-panel-comments/:assessmentID", isAuthenticated, assessController.g_reportPanelComments);
router.get("/assess/report-section/:assessmentID/:standard", isAuthenticated, assessController.g_reportSection);
router.get("/assess/report-section-actions/:assessmentID/:standard", isAuthenticated, assessController.g_reportSectionActions);
router.get("/assess/report-section-actions-add/:assessmentID/:standard", isAuthenticated, assessController.g_reportSectionActionsAdd);
router.get("/assess/report-section-actions-manage/:assessmentID/:standard/:uniqueID", isAuthenticated, assessController.g_reportSectionActionsManage);

router.post("/assess/report-section", isAuthenticated, assessController.p_reportSection);
router.post("/assess/report-section-actions-add", isAuthenticated, assessController.p_reportSectionActionsAdd);
router.post("/assess/report-section-actions-manage", isAuthenticated, assessController.p_reportSectionActionsManage);
router.post("/assess/report-panel-comments", isAuthenticated, assessController.p_reportPanelComments);
router.post("/assess/submit-report", isAuthenticated, assessController.p_submitReport);
router.post("/assess/pr-report", isAuthenticated, assessController.p_submitPRReport);

// REPORTS ROUTES
router.get('/reports', isAuthenticated, reportsController.g_index);
router.get('/reports/report/:assessmentID', isAuthenticated, reportsController.g_report);
router.get("/report/generate-doc/:assessmentID", isAuthenticated, reportsController.g_doc);
router.get("/report/generate-excel/:assessmentID", isAuthenticated, reportsController.g_excel);

// Service Admin routes
router.get('/service-admin/create-department', isAuthenticated, serviceAdminController.g_createDepartment);

router.post('/service-admin/create-department', isAuthenticated, serviceAdminController.p_createDepartment);

// Volunteer
router.get('/volunteer', isAuthenticated, assessController.g_volunteer);
router.get("/volunteer/get-data/:id", isAuthenticated, assessController.g_data);
router.get("/volunteer/volunteer/:id/:role", isAuthenticated, assessController.g_volunteerA);
router.get("/volunteer/detail/:id/", isAuthenticated, assessController.g_detail);
router.get("/volunteer/submitted/:id/", isAuthenticated, assessController.g_submitted);

router.post("/volunteer", isAuthenticated, assessController.p_volunteer);

// PROFILE ROUTES
router.get('/profile', isAuthenticated, profileController.g_profile);
router.get('/profile/change-name', isAuthenticated, profileController.g_changeName);
router.get('/profile/change-email', isAuthenticated, profileController.g_changeEmail);

router.post('/profile/change-name', isAuthenticated, profileController.p_changeName);
router.post('/profile/change-email', isAuthenticated, profileController.p_changeEmail);

module.exports = router;
