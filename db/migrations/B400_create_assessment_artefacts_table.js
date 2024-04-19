exports.up = function (knex) {
    return knex.schema.createTable('AssessmentArtefacts', function (table) {
        table.bigIncrements('ArtefactID').primary();
        table.integer('AssessmentID').references('AssessmentID').inTable('Assessment').onDelete('SET NULL');
        table.uuid('UniqueID').defaultTo(knex.raw('gen_random_uuid()'));
        table.string('Title', 70);
        table.string('Description', 200);
        table.dateTime('Created', { precision: 7 }).defaultTo(knex.fn.now());
        table.integer('CreatedBy').references('UserID').inTable('User').onDelete('SET NULL');
        table.text('URL');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('AssessmentArtefacts');
};
