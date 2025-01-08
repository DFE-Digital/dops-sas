exports.up = function (knex) {
    return knex.schema.table('Assessment', function (table) {
        table.string('SlackID').nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table('Assessment', function (table) {
        // If you added a foreign key constraint, drop it first; adjust the constraint name as needed:
        // table.dropForeign('DepartmentID');
        table.dropColumn('SlackID');
    });
};
