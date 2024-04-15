const { check, validationResult } = require('express-validator');

exports.validateRequest = [
    check('process')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            if (!['Accept', 'Reject'].includes(value)) {
                throw new Error('Invalid option selected');
            }
            return true;
        })
];

exports.validateAddPanel = [
    check('Assessor')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an assessor');
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

exports.validateAddAdmin = [
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
    check('EmailAddress')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter an email address');
            }
            return true;
        }),
    check('createAsLead')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            return true;
        })
];

exports.validateAddTraining = [
    check('Training')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select a training type');
            }
            return true;
        })
];