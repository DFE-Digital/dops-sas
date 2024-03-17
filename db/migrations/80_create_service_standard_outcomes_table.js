exports.up = function(knex) {
    return knex.schema.createTable('ServiceStandardOutcomes', table => {
      table.bigIncrements('ID').primary();
      table.integer('AssessmentID').nullable().references('AssessmentID').inTable('Assessment');
      table.integer('Standard').nullable();
      table.string('Outcome', 10).nullable();
      table.integer('CreatedBy').nullable().references('UserID').inTable('User');
      table.timestamp('Created', { useTz: true }).nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('ServiceStandardOutcomes');
  };
  