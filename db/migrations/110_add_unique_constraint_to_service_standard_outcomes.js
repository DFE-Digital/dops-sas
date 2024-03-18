exports.up = function(knex) {
    return knex.schema.alterTable('ServiceStandardOutcomes', table => {
      table.unique(['AssessmentID', 'Standard'], 'assessment_standard_unique');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('ServiceStandardOutcomes', table => {
      table.dropUnique(['AssessmentID', 'Standard'], 'assessment_standard_unique');
    });
};
