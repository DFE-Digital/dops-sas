const { check, validationResult } = require('express-validator');

exports.validateAddArtefact = [
    check('Title')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a title');
            }
            return true;
        }),
    check('URL')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a URL');
            }
            return true;
        })
];

exports.validateAddTeam = [
    check('EmailAddress')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter an email');
            }
            if (value.endsWith('digital.education.gov.uk')) {
                throw new Error('Use education.gov.uk instead of digital.education.gov.uk');
            }
            return true;
        }),
    check('FirstName')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a first name');
            }
            return true;
        }),
    check('LastName')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a last name');
            }
            return true;
        }),
    check('Role')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select a role');
            }
            return true;
        })
];