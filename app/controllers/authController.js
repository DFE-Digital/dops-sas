const { check, validationResult } = require('express-validator');
const { validateSignIn } = require('../validation/authValidation');
const { v4: uuidv4 } = require('uuid');
const { checkAndSetUserToken, checkToken } = require('../models/user'); // Adjust the path as necessary
const { sendNotifyEmail } = require('../middleware/notify');


exports.g_signin = (req, res) => {
    res.render('auth/sign-in');
};

exports.g_checktoken = async (req, res) => {

    const { token } = req.params;

    if(!token){
        return res.redirect('/sign-in');
    }

    try{

        const user = await checkToken(token);
        if(!req.session.data){
            req.session.data = {};
        }   

        if(user === 0)
        {
            return res.redirect('/sign-out')
        }

        req.session.UserId = user.UserID;
        req.session.data['User'] = user;

        return res.redirect('/manage')



    }catch(error){
        console.error('Error:', error);
        return res.redirect('/error')
    }



    res.redirect('/manage');
};

exports.g_signout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session error:", err);
            return res.status(500).send("Could not sign out, please try again.");
        }

        res.clearCookie('connect.sid'); // Adjust cookie name if different
        res.redirect('/sign-in');
    });
};

exports.g_checkemail = (req, res) => {
    res.render('auth/check-email');
};


/**
 * Handle sign in on POST.
 * This is the form that the user will complete to sign in
 * We will check the email is valid
 * If the email is valid, we will create a token and send the user an email with a token using GOV.UK Notify
 * If the email is not valid, we will return the user to the sign in page with an error
 * @param {string} email - The user's email address
 */
exports.p_signin = [
    validateSignIn,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('auth/sign-in', {
                errors: errors.array()
            });
        }

        // Get the user's email address from the form
        const { EmailAddress } = req.body;

        try {
            const token = uuidv4();
            const tokenExpiry = new Date()
            tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 30);
            const formattedTokenExpiry = tokenExpiry.toISOString().slice(0, 19);

            const userId = await checkAndSetUserToken(EmailAddress, token, formattedTokenExpiry);

            if (userId != 0) {

                // Send the user an email with the token using GOV.UK Notify    
                const templateId = process.env.email_MagicLinkTemplate; // Replace with your actual template ID
                const templateParams = {
                    serviceURL: process.env.serviceURL,
                    token: token
                };

                // Send the email
                const emailSent = await sendNotifyEmail(templateId, EmailAddress, templateParams);
                if (emailSent) {
                    console.log('Email sent successfully');
                } else {
                    console.error('Failed to send email');
                }

                // Return the user to the check email page
                return res.redirect('/check-email')
            }
            else {
                return res.redirect('/error')
            }

        } catch (error) {
            console.error('Error:', error);
            return res.render('sign-in', { errors })
        }
    }
];


