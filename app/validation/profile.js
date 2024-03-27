const { check, validationResult } = require('express-validator');

exports.validateChangeName = [
    check('firstName')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter your first name');
            }
            return true;
        }),
        check('lastName')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter your last name');
            }
            return true;
        })
];

exports.validateChangeEmail = [
    check('emailAddress')
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
  