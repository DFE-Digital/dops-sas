exports.up = function(knex) {
    return knex.schema.createTable('sessions', function(table) {
      table.text('sid').primary();
      table.json('sess').notNullable();
      table.timestamp('expire', { precision: 6 }).notNullable().index();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('sessions');
  };
  