exports.up = function(knex) {
    return knex.schema.createTable('ServiceStandards', table => {
      table.increments('ID').primary();
      table.integer('Point').notNullable();
      table.string('Title', 255).notNullable();
      table.text('Description').nullable();
      table.string('Partial', 50).nullable();
      table.text('Assessors').nullable();
      table.text('Url').nullable();
      table.string('StandardOwner', 100).nullable();
      table.string('AdditionalReference', 50).nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('ServiceStandards');
  };
  