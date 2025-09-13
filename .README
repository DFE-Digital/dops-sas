# Service Assessment Service

## Description

The Service Assessment Service is a web application designed to facilitate the assessment of government services. It provides a digital service for users to book, manage, assess and view reports, as well as department assurance to administer assessments against the GOV Service Standard.

## Features

- User registration and authentication using magic links
- Book assessment
- Manage a service assessment (as a team)
- Assess a service (as an assessor)
- Admin dashboard for managing assessments and users
- View completed assessments

## Dependencies

1. You will need a Postgres database to store data.
2. Notify - Contact us on design.ops@education.gov.uk to get the templates and documentation

## Installation

1. Clone the repository: `git clone https://github.com/DFE-Digital/dops-sas.git`
2. Navigate to the project directory: `cd service-assessment-service`
3. Install dependencies: `npm install`
4. Set up the database: `npm run migrate`
5. To install the GOV.UK Service Standard / or DfE Implementation, copy the appropriate seed file from the `/db/dfe_seeds` folder to the `/db/seeds` folder
6. Update admin details in the `/db/seeds/a100_setup.js` file updating the values for:
   - const emailAddress = 'john.smith@example.gov.uk';
   - const firstName = 'John';
   - const lastName = 'Smith';
   - const departmentName = 'Department for Example';
   - const departmentEmailDomain = 'example.gov.uk';
7. Seed the database with the service standard: `npm run seed`
8. Start the server: `npm start`

## Usage

1. Open your web browser and navigate to `http://localhost:3921`
2. Register a new user account or log in with an existing one
3. Explore the available services and assess them based on your experience
4. Use the search functionality to find specific services
5. Manage your profile settings and view your assessment history

## Contributing

Contributions are welcome! If you would like to contribute to this project, please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## Maintenance and support

This service has been built and is maintained by the [DesignOps team](https://design.education.gov.uk/design-ops) in the Department for Education. Contact us to discuss the service.

## License

This project is licensed under the [MIT License](LICENSE).
