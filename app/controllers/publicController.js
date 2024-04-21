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



exports.g_home = (req, res) => {

    if (req.session && req.session.data) {
        return res.redirect('/manage')
    }

    res.render('index')
}

exports.g_features = (req, res) => {
    res.render('features/index')
}

exports.g_features_book = (req, res) => {
    res.render('features/book')
}
exports.g_features_manage = (req, res) => {
    res.render('features/manage')
}
exports.g_features_assess = (req, res) => {
    res.render('features/assess')
}
exports.g_features_reports = (req, res) => {
    res.render('features/reports')
}
exports.g_features_admin = (req, res) => {
    res.render('features/admin')
}

exports.g_features_installation = (req, res) => {
    res.render('features/installation/index')
}

exports.g_support = (req, res) => {
    res.render('support')
}

exports.g_accessibility = (req, res) => {
    res.render('accessibility')
}

exports.g_privacy = (req, res) => {
    res.render('privacy')
}

exports.g_cookies = (req, res) => {
    res.render('cookies')
}

exports.g_notAssessor = (req, res) => {
    res.render('not-assessor')
}



/**
 * redirect to assidfe based on the parmeter
 * @param {standard} the specific standard to redirect to assidfe
 */
exports.g_assidfe = async (req, res) => {
    const { standard } = req.params
    console.log(standard)

    const serviceStandards = await getServiceStandards()

    console.log(serviceStandards)   

    const standardData = serviceStandards.find(s => s.Point == standard)

    console.log(standardData)

    return res.redirect(standardData.Url);

}

