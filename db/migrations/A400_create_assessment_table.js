exports.up = function(knex) {
  return knex.schema.createTable('Assessment', (table) => {
    table.increments('AssessmentID').primary();
    table.string('Type', 50);
    table.string('Phase', 50);
    table.string('Status', 50);
    table.string('Outcome', 10);
    table.string('Name', 300);
    table.string('Description', 750);
    table.string('ProjectCodeYN', 3);
    table.string('ProjectCode', 50);
    table.dateTime('StartDate');
    table.string('EndDateYN', 3);
    table.dateTime('EndDate');
    table.text('RequestedWeeks');
    table.string('Portfolio', 100);
    table.integer('DD').unsigned().references('UserID').inTable('User').onUpdate('CASCADE').onDelete('SET NULL');
    table.integer('SRO').unsigned().references('UserID').inTable('User').onUpdate('CASCADE').onDelete('SET NULL');
    table.string('PMYN', 3);
    table.integer('PM').unsigned().references('UserID').inTable('User').onUpdate('CASCADE').onDelete('SET NULL');
    table.string('DMYN', 3);
    table.integer('DM').unsigned().references('UserID').inTable('User').onUpdate('CASCADE').onDelete('SET NULL');
    table.integer('CreatedBy').notNullable().unsigned().references('UserID').inTable('User').onUpdate('CASCADE').onDelete('SET NULL');
    table.dateTime('CreatedDate').notNullable();
    table.integer('SubmittedBy').unsigned().references('UserID').inTable('User').onUpdate('CASCADE').onDelete('SET NULL');
    table.dateTime('SubmittedDate');
    table.dateTime('AssessmentDateTime');
    table.integer('SubStatusCode');
    table.text('PanelComments');
    table.text('PanelCommentsImprove');
    table.boolean('PanelCommentsComplete');
    table.string('AssessmentTime', 50);
    table.integer('Department').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('Assessment');
};
