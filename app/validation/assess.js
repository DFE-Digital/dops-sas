const { check, validationResult } = require('express-validator');

exports.validateAddRating = [
    check('outcomerag')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            if (!['Red', 'Amber', 'Green', 'NA'].includes(value)) {
                throw new Error('Invalid option selected');
            }
            return true;
        })
];


exports.validateAddAction = [
    check('actionPlanItem')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter an action');
            }
            return true;
        })
];

exports.validateAddComment = [
    check('comment')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a comment');
            }
            return true;
        })
];



exports.validateAddComments = [
    check('PanelComments')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter some comments');
            }
            return true;
        })
];