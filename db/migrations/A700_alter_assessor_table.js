exports.up = function(knex) {
    return knex.schema.table('Assessor', function(table) {
      table.integer('DepartmentID').nullable();
      // If you also want to create a foreign key constraint to a 'Department' table, uncomment the next line:
      // table.foreign('DepartmentID').references('DepartmentID').inTable('Department');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('Assessor', function(table) {
      // If you added a foreign key constraint, drop it first; adjust the constraint name as needed:
      // table.dropForeign('DepartmentID');
      table.dropColumn('DepartmentID');
    });
  };
  