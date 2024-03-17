/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

exports.seed = async function (knex) {
  // Check if the "Department for Education" exists and insert if not
  const deptExists = await knex('Department')
    .where({ Name: 'Department for Education' })
    .first();

  if (!deptExists) {
    await knex('Department').insert({
      Name: 'Department for Education',
      Domain: 'education.gov.uk',
      SelfRegistrationAllowed: true,
      DepartmentLeadUserID: 1
    });
  }
};