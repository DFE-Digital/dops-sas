/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

exports.seed = async function(knex) {
  // Checks if the admin user already exists
  const userExists = await knex('User').where('EmailAddress', 'andy.jones@education.gov.uk').first();

  if (!userExists) {
    // Admin user doesn't exist, proceed with insertion
    await knex('User').insert([
      {
        EmailAddress: 'andy.jones@education.gov.uk',
        FirstName: 'Andy',
        LastName: 'Jones',
        CreatedBy: 0, 
        CreatedByProcess: 'Seed Script',
        AccountActive: true,
        Department: 1
      }
    ]);
    console.log('Admin user added');
  } else {
    console.log('Admin user already exists');
  }
};
