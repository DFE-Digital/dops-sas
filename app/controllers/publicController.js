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

exports.g_home = (req, res) => {

    if(req.session && req.session.data) {
       return res.redirect('/manage')
    }

    res.render('index')
}

exports.g_features = (req, res) => {
    res.render('features')
}

exports.g_contact = (req, res) => {
    res.render('contact')
}