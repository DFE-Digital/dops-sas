exports.up = function(knex) {
    return knex.schema.createTable('Actions', table => {
      table.bigIncrements('ActionID').primary();
      table.integer('AssessmentID').nullable();
      table.string('Comments', 300).nullable();
      table.integer('Point').nullable();
      table.integer('CreatedBy').nullable();
      table.dateTime('Created').nullable();
      table.string('Status', 50).nullable();
      table.integer('AssignedTo').nullable();
      table.uuid('UniqueID').defaultTo(knex.raw('gen_random_uuid()')).nullable();
      table.dateTime('EstimatedResolutionDate').nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('Actions');
  };
  