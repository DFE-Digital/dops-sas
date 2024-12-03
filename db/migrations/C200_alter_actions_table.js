exports.up = function (knex) {
    return knex.schema.alterTable('Actions', table => {
        table.string('Comments', 1000).nullable().alter();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('Actions', table => {
        table.string('Comments', 300).nullable().alter();
    });
};