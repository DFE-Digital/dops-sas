exports.up = function (knex) {
    return knex.schema.table('Assessor', table => {
        table.boolean('Deleted').defaultTo(false); // Add the 'Deleted' column with a default value of false
    });
};

exports.down = function (knex) {
    return knex.schema.table('Assessor', table => {
        table.dropColumn('Deleted'); // Remove the 'Deleted' column if rolled back
    });
};