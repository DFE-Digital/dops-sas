/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  try {
    const emailAddress = 'andy.jones@education.gov.uk';
    const firstName = 'Andy';
    const lastName = 'Jones';
    const departmentName = 'Department for Education';
    const departmentEmailDomain = 'education.gov.uk';

    // Check if the department exists and retrieve its ID, or create it
    let departmentResult = await knex('Department')
      .where({ Name: departmentName })
      .select('DepartmentID')
      .first();

    let departmentId;
    if (!departmentResult) {
      const insertedDepartments = await knex('Department').insert({
        Name: departmentName,
        Domain: departmentEmailDomain,
        SelfRegistrationAllowed: true
      }, ['DepartmentID']);  // Ensure this returns an array of objects with DepartmentID
      departmentId = insertedDepartments[0].DepartmentID;  // Extract DepartmentID correctly
    } else {
      departmentId = departmentResult.DepartmentID;
    }

    // Check if the user exists and retrieve their ID, or create them
    let userResult = await knex('User')
      .where({ EmailAddress: emailAddress })
      .select('UserID')
      .first();

    let userId;
    if (!userResult) {
      const insertedUsers = await knex('User').insert({
        EmailAddress: emailAddress,
        FirstName: firstName,
        LastName: lastName,
        CreatedBy: 0,
        CreatedByProcess: 'Seed Script',
        AccountActive: true,
        Department: departmentId
      }, ['UserID']);  // Ensure this returns an array of objects with UserID
      userId = insertedUsers[0].UserID;  // Extract UserID correctly
    } else {
      userId = userResult.UserID;
    }

    // Update the DepartmentLeadUserID in the Department table
    await knex('Department')
      .where({ DepartmentID: departmentId })
      .update({ DepartmentLeadUserID: userId });

    // Check if the user role exists, if not, insert it
    const roleExists = await knex('UserRole')
      .where({
        UserID: userId,
        UserRole: 'Department lead'
      })
      .first();

    if (!roleExists) {
      await knex('UserRole').insert({
        UserID: userId,
        UserRole: 'Department lead',
        Active: true,
        Created: new Date(),
        CreatedBy: 0,
        Updated: new Date(),
        UpdatedBy: 0
      });
    }
  } catch (error) {
    console.error('Error during seeding:', error);
  }
};
