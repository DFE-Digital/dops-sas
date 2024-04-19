exports.up = function(knex) {
    // Ensure the pgcrypto extension is available for UUID generation
    return knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
        .then(function() {
            return knex.schema.createTable('AssessmentPanel', function(table) {
                table.increments('AssessmentPanelID').primary();
                table.string('Role', 50);
                table.integer('UserID').nullable(); 
                table.integer('AssessmentID').nullable(); 
                table.uuid('UniqueID').defaultTo(knex.raw('gen_random_uuid()'));
                
                // Foreign key constraints
                table.foreign('AssessmentID').references('AssessmentID').inTable('Assessment');
                table.foreign('UserID').references('UserID').inTable('User');
            });
        });
};

exports.down = function(knex) {
    return knex.schema.dropTable('AssessmentPanel');
};
