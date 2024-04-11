const { check, validationResult } = require('express-validator');
const { validateChangeName, validateChangeEmail } = require('../validation/profile');
const { getBasicUserDetails, updateName, updateEmail } = require('../models/user');

const { getRoleByUserID } = require('../models/userrole');
const e = require('express');

exports.g_profile = async (req, res) => {

    const user = req.session.data.User;

    const roles = await getRoleByUserID(user.UserID);

   
    if (roles) {
        req.session.data['IsAdmin'] = true;
    }
    else {  
        req.session.data['IsAdmin'] = false;
    }



    res.render('profile/index')
}

exports.g_changeName = (req, res) => {
    res.render('profile/change-name')
}
exports.g_changeEmail = (req, res) => {
    res.render('profile/change-email')
}



exports.p_changeName = [
    validateChangeName,
    async (req, res) => {
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


        return res.redirect('/profile');

    }
];

exports.p_changeEmail = [
    validateChangeEmail,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('profile/change-email', {
                errors: errors.array()
            });
        }

        const { emailAddress } = req.body;

        // Update existing assessment
        await updateEmail(emailAddress, req.session.data.User.UserID);

        // Update the session data
        const model = await getBasicUserDetails(req.session.data.User.UserID);

        req.session.data.User = model;

        return res.redirect('/profile');
    }
];





