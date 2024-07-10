const { check, validationResult } = require('express-validator');
const { validateChangeName, validateChangeEmail } = require('../validation/profile');
const { getBasicUserDetails, updateName, updateEmail } = require('../models/user');
const { getAssessmentPanelByUserID } = require('../models/assessmentModel');
const { getAllAssessors, createAssessor, getAssessorByUserID, getTrainingForUser } = require('../models/assessors');
const { getRoleByUserID } = require('../models/userrole');

const { getDepartments, getDepartmentForUser } = require('../models/departments');

const e = require('express');

exports.g_profile = async (req, res, next) => {
    try {

        const user = req.session.data.User;
        const roles = await getRoleByUserID(user.UserID);

        if (roles) {
            req.session.data['IsAdmin'] = true;
        }
        else {
            req.session.data['IsAdmin'] = false;
        }

        const assessor = await getAssessorByUserID(user.UserID);

        if (assessor) {
            req.session.data['IsAssessor'] = true;
        }
        else {
            req.session.data['IsAssessor'] = false;
        }

        const department = await getDepartmentForUser(req.session.data.User.Department);
        req.session.data['Department'] = department;

        res.render('profile/index');
    } catch (error) {
        next(error)
    }
}

exports.g_changeName = (req, res, next) => {
    try {
        res.render('profile/change-name')
    } catch (error) {
        next(error)
    }
}
exports.g_changeEmail = (req, res, next) => {
    try {
        res.render('profile/change-email')
    } catch (error) {
        next(error)
    }
}

exports.g_training = async (req, res, next) => {
    try {
        const training = await getTrainingForUser(req.session.data.User.UserID);

        res.render('profile/training', { training })
    } catch (error) {
        next(error)
    }
}

exports.g_history = async (req, res, next) => {
    try {
        const user = req.session.data.User;
        const assessments = await getAssessmentPanelByUserID(user.UserID);
        return res.render('profile/history', {
            assessments
        })
    } catch (error) {
        next(error)
    }
}


exports.p_changeName = [
    validateChangeName,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('profile/change-name', {
                    errors: errors.array()
                });
            }

            const { firstName, lastName } = req.body;

            // Update existing assessment
            await updateName(firstName, lastName, req.session.data.User.UserID);

            // Update the session data
            const model = await getBasicUserDetails(req.session.data.User.UserID);

            req.session.data.User = model;

            // This could be the first time, and come from an email, so lets see if there is a redirect url

            // if req.session.originalUrl exists
            if (req.session.originalUrl !== undefined) {
                const redirectUrl = req.session.originalUrl
                delete req.session.originalUrl;
                return res.redirect(redirectUrl);
            }

            return res.redirect('/profile');
        } catch (error) {
            next(error)
        }

    }
];

exports.p_changeEmail = [
    validateChangeEmail,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('profile/change-email', {
                    errors: errors.array()
                });
            }

            const { emailAddress } = req.body;
            
            var email = emailAddress.toLowerCase()

            await updateEmail(email, req.session.data.User.UserID);
            const model = await getBasicUserDetails(req.session.data.User.UserID);

            req.session.data.User = model;
            
            return res.redirect('/profile');
        } catch (error) {
            next(error)
        }
    }
];





