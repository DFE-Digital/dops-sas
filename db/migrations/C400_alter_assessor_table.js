exports.up = async function (knex) {
    return knex.schema.alterTable('Assessor', (table) => {
        table.unique('UserID'); // Add a unique constraint to the UserID column
    });
};

exports.down = async function (knex) {
    return knex.schema.alterTable('Assessor', (table) => {
        table.dropUnique('UserID'); // Remove the unique constraint if the migration is rolled back
    });
};