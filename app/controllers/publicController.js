/**
 *  Public routes contoller
 * 
 *  This file defines the controllers for the public-facing pages of the website.
 * 
 *  Functions that start with g_ are GET requests.
 *  Functions that start with p_ are POST requests.
 * 
 *  Built by Andy Jones - DesignOps - Department for Education
 * 
 */


const { getServiceStandards } = require('../models/standards');

exports.g_home = (req, res, next) => {
    try {

        if (req.session && req.session.data) {
            return res.redirect('/manage')
        }

        res.render('index')
    } catch (error) {
        next(error)
    }
}

exports.g_features = (req, res, next) => {
    try {
        res.render('features/index')
    } catch (error) {
        next(error)
    }
}

exports.g_features_book = (req, res, next) => {
    try {
        res.render('features/book')
    } catch (error) {
        next(error)
    }
}
exports.g_features_manage = (req, res, next) => {
    try {
        res.render('features/manage')
    } catch (error) {
        next(error)
    }
}
exports.g_features_assess = (req, res, next) => {
    try {
        res.render('features/assess')
    } catch (error) {
        next(error)
    }
}
exports.g_features_reports = (req, res, next) => {
    try {
        res.render('features/reports')
    } catch (error) {
        next(error)
    }
}
exports.g_features_admin = (req, res, next) => {
    try {
        res.render('features/admin')
    } catch (error) {
        next(error)
    }
}

exports.g_features_installation = (req, res, next) => {
    try {
        res.render('features/installation/index')
    } catch (error) {
        next(error)
    }
}

exports.g_support = (req, res, next) => {
    try {
        res.render('support')
    } catch (error) {
        next(error)
    }
}

exports.g_accessibility = (req, res, next) => {
    try {
        res.render('accessibility')
    } catch (error) {
        next(error)
    }
}

exports.g_privacy = (req, res, next) => {
    try {
        res.render('privacy')
    } catch (error) {
        next(error)
    }
}

exports.g_cookies = (req, res, next) => {
    try {
        res.render('cookies')
    } catch (error) {
        next(error)
    }
}

exports.g_notAssessor = (req, res, next) => {
    try {
        res.render('not-assessor')
    } catch (error) {
        next(error)
    }
}



/**
 * redirect to assidfe based on the parmeter
 * @param {standard} the specific standard to redirect to assidfe
 */
exports.g_assidfe = async (req, res, next) => {
    try {
        const { standard } = req.params
        const serviceStandards = await getServiceStandards()
        const standardData = serviceStandards.find(s => s.Point == standard)
        return res.redirect(standardData.Url);
    } catch (error) {
        next(error)
    }
}

