const { check, validationResult } = require('express-validator');

exports.validateChangeName = [
    check('firstName')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a first name');
            }
            return true;
        }),
        check('lastName')
        .trim()
        .custom((value, { req }) => {
            if (value === '') {
                throw new Error('Enter a last name');
            }
            return true;
        })
];

exports.validateChangeEmail = [
    check('emailAddress')
      .trim()
      .custom((value, { req }) => {
        if (value === '') {
          throw new Error('Enter an email address.');
        }
        if (!/\S+@\S+\.\S+/.test(value)) {
          throw new Error('Enter a valid email address.');
        }
        if (!value.endsWith('@education.gov.uk')) {
          throw new Error('Email must be an education.gov.uk address.');
        }
        return true;
      })
  ];
  