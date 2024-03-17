
exports.up = function(knex) {
    return knex.schema.createTable('Department', table => {
      table.increments('DepartmentID').primary();
      table.string('Name', 100).notNullable();
      table.text('Domain').notNullable();
      table.boolean('SelfRegistrationAllowed').notNullable();
      table.integer('DepartmentLeadUserID').unsigned();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('Department');
  };