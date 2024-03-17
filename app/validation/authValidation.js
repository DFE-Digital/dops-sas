/**
 * Validate the sign in form
 * Check that the email address has been provided, is an email address format and is an education.gov.uk address
 * Change History:
 * - 14 Mar 2024 File created by Andy Jones - DesignOps - Department for Education
 */

const { check, validationResult } = require('express-validator');

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
      if (!value.endsWith('@education.gov.uk')) {
        throw new Error('Email must be an education.gov.uk address.');
      }
      return true;
    })
];
