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