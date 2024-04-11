/**
 * Handles validation for the book journey pages
 */

const { check, validationResult } = require('express-validator');

exports.validatePhase = [
    check('Phase')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            if (!['Discovery', 'Alpha', 'Private Beta', 'Public Beta', 'Live'].includes(value)) {
                throw new Error('Invalid phase selected');
            }
            return true;
        })
];

exports.validateType = [
    check('Type')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            if (!['Peer review', 'Service assessment'].includes(value)) {
                throw new Error('Invalid type selected');
            }
            return true;
        })
];

exports.validateName = [
    check('Name')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a name');
            }
            return true;
        })
];

exports.validateDescription = [
    check('Description')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a description');
            }
            if (value.length > 750) {
                throw new Error('Description must be less than 750 characters');
            }
            return true;
        })
];


exports.validateCode = [
    check('ProjectCodeYN')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            if (!['Yes', 'No'].includes(value)) {
                throw new Error('Invalid type selected');
            }
            return true;
        }),
    check('ProjectCode')
        .trim()
        .custom((value, { req }) => {
            // Check if ProjectCodeYN is 'Yes' and ProjectCode is empty or does not meet your criteria
            if (req.body.ProjectCodeYN === 'Yes' && value === '') {
                throw new Error('Enter your project code');
            }

            // Add any additional validation criteria for ProjectCode here

            return true; // Validation passed
        })
];

exports.validateDate = [
    check('Day')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a day');
            }
            if (value < 1 || value > 31) {
                throw new Error('Enter a valid day');
            }
            return true;
        }),
    check('Month')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a month');
            }
            if (value < 1 || value > 12) {
                throw new Error('Enter a valid month');
            }
            return true;
        }),
    check('Year')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a year');
            }
            if (value < 2020 || value > 2099) {
                throw new Error('Enter a valid year');
            }
            return true;
        }),
];



exports.validateEndDate = [
    check('EndDateYN')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            if (!['Yes', 'No'].includes(value)) {
                throw new Error('Invalid type selected');
            }
            return true;
        }),
    check('EndDay')
        .trim()
        .if((value, { req }) => req.body.EndDateYN === 'Yes') // Conditional validation
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a day');
            }
            const day = parseInt(value, 10);
            if (isNaN(day) || day < 1 || day > 31) {
                throw new Error('Enter a valid day');
            }
            return true;
        }),
    check('EndMonth')
        .trim()
        .if((value, { req }) => req.body.EndDateYN === 'Yes') // Conditional validation
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a month');
            }
            const month = parseInt(value, 10);
            if (isNaN(month) || month < 1 || month > 12) {
                throw new Error('Enter a valid month');
            }
            return true;
        }),
    check('EndYear')
        .trim()
        .if((value, { req }) => req.body.EndDateYN === 'Yes') // Conditional validation
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a year');
            }
            const year = parseInt(value, 10);
            if (isNaN(year) || year < 2020 || year > 2099) {
                throw new Error('Enter a valid year');
            }
            return true;
        }),
];

exports.validateEndDates = [
    check('ReviewWeek')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select some options');
            }
            return true;
        })
];


exports.validatePortfolio = [
    check('Portfolio')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Select an option');
            }
            return true;
        })
];

exports.validateDD = [
    check('ddemail')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter an email address');
            }
            if (!/\S+@\S+\.\S+/.test(value)) {
                throw new Error('Please enter a valid email address.');
            }
            return true;
        }),
    // check('ddfirstName')
    //     .trim()
    //     .custom((value, { req }) => {
    //         if (value === '') {
    //             throw new Error('Enter a first name');
    //         }
    //         return true;
    //     }),
    // check('ddlastName')
    //     .trim()
    //     .custom((value, { req }) => {
    //         if (value === '') {
    //             throw new Error('Enter a last name');
    //         }
    //         return true;
    //     }),
];


exports.validatePM = [
    check('pm')
    .trim()
    .custom((value, { req }) => {
        if (value === '') {
            throw new Error('Select an option');
        }
        return true;
    }),
    check('pmemail')
        .trim()
        .if((value, { req }) => req.body.pm === 'Yes') 
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter an email address');
            }
            if (!/\S+@\S+\.\S+/.test(value)) {
                throw new Error('Please enter a valid email address.');
            }
            return true;
         }),
    // check('pmfirstName')
    //     .trim()
    //     .if((value, { req }) => req.body.pm === 'Yes') 
    //     .custom((value, { req }) => {
    //         if (value === '') {
    //             throw new Error('Enter a first name');
    //         }
    //         return true;
    //     }),
    // check('pmlastName')
    //     .trim()
    //     .if((value, { req }) => req.body.pm === 'Yes') 
    //     .custom((value, { req }) => {
    //         if (value === '') {
    //             throw new Error('Enter a last name');
    //         }
    //         return true;
    //     }),
];

exports.validateDM = [
    check('dm')
    .trim()
    .custom((value, { req }) => {
        if (value === '') {
            throw new Error('Select an option');
        }
        return true;
    }),
    check('dmemail')
        .trim()
        .if((value, { req }) => req.body.dm === 'Yes') 
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter an email address');
            }
            if (!/\S+@\S+\.\S+/.test(value)) {
                throw new Error('Please enter a valid email address.');
            }
            return true;
        }),
    // check('dmfirstName')
    //     .trim()
    //     .if((value, { req }) => req.body.dm === 'Yes') 
    //     .custom((value, { req }) => {
    //         if (value === '') {
    //             throw new Error('Enter a first name');
    //         }
    //         return true;
    //     }),
    // check('dmlastName')
    //     .trim()
    //     .if((value, { req }) => req.body.dm === 'Yes') 
    //     .custom((value, { req }) => {
    //         if (value === '') {
    //             throw new Error('Enter a last name');
    //         }
    //         return true;
    //     }),
];
