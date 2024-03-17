exports.up = function(knex) {
    return knex.schema.createTable('UserRole', table => {
      table.bigIncrements('UserRoleID').primary();
      table.integer('UserID').nullable();
      table.string('UserRole', 50).nullable();
      table.boolean('Active').nullable();
      table.dateTime('Created').nullable();
      table.integer('CreatedBy').nullable();
      table.dateTime('Updated').nullable();
      table.integer('UpdatedBy').nullable();

      table.foreign('UserID', 'fk_userrole_user_userid').references('UserID').inTable('User').onDelete('SET NULL').onUpdate('CASCADE');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('UserRole');
};
