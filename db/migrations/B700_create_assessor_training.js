exports.up = function (knex) {
    return knex.schema.createTable('AssessorTraining', table => {
        table.increments('AssessorTrainingID').primary();
        table.uuid('UniqueID').defaultTo(knex.raw('gen_random_uuid()')).notNullable();
        table.string('UserID').notNullable();
        table.string('Training').notNullable();
        table.date('Date').notNullable();
        table.string('Provider').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('AssessorTraining');
};
