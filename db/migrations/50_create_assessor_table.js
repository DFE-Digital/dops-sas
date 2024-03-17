exports.up = function(knex) {
    return knex.schema.createTable('Assessor', table => {
      table.increments('AssessorID').primary();
      table.integer('UserID').nullable();
      table.string('PrimaryRole', 50).nullable();
      table.boolean('Active').nullable();
      table.boolean('CrossGovAssessor').nullable();
      table.boolean('ExternalAssessor').nullable();
      table.boolean('LeadAssessor').nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('Assessor');
  };
  