exports.up = function (knex) {
  return knex.schema.createTable('Audit', table => {
    table.bigIncrements('ActionID').primary();
    table.integer('AssessmentID').nullable();
    table.string('Action', 300).nullable();
    table.string('Comments', 300).nullable();
    table.integer('CreatedBy').nullable();
    table.dateTime('Created').nullable();
    table.uuid('UniqueID').defaultTo(knex.raw('gen_random_uuid()')).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('Audit');
};
