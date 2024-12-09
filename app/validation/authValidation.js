/**
 * Validate the sign in form
 * Check that the email address has been provided, is an email address format and is an education.gov.uk address
 * Change History:
 * - 14 Mar 2024 File created by Andy Jones - DesignOps - Department for Education
 */

const { check, validationResult } = require('express-validator');
const domainWhiteList = process.env.domainWhiteList.split(',');

exports.validateSignIn = [
  check('EmailAddress')
    .trim()
    .custom((value, { req }) => {
      if (value === '') {
        throw new Error('Please enter your email address.');
      }
      if (!/\S+@\S+\.\S+/.test(value)) {
        throw new Error('Please enter a valid email address.');
      }
      // Only allow emails which end with whitelisted domains from process.env.domainWhileList comma separated list
      
      if (!domainWhiteList.some((domain) => value.endsWith(domain))) {
        throw new Error('Unable to register, please contact support.');
      }
      if (value.endsWith('digital.education.gov.uk')) {
        throw new Error('Use education.gov.uk instead of digital.education.gov.uk');
      }
      return true;
    })
];
