exports.up = function(knex) {
    return knex.schema.createTable('AssessmentTeam', table => {
      table.increments('ID').primary();
      table.integer('UserID').nullable().references('UserID').inTable('User').onDelete('SET NULL').onUpdate('CASCADE');
      table.string('Role', 50).nullable();
      table.integer('AssessmentID').nullable().references('AssessmentID').inTable('Assessment').onDelete('SET NULL').onUpdate('CASCADE');
      table.uuid('UniqueID').defaultTo(knex.raw('gen_random_uuid()')).nullable();
      // Additional configurations or constraints can be added here
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('AssessmentTeam');
  };
  