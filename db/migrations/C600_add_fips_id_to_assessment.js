exports.up = function(knex) {
  return knex.schema.alterTable('Assessment', (table) => {
    table.string('FIPS_ID', 100);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('Assessment', (table) => {
    table.dropColumn('FIPS_ID');
  });
};
