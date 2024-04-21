exports.up = function(knex) {
    return knex.schema.createTable('SurveyData', table => {
      table.increments('id').primary();
      table.integer('AssessmentID').notNullable().references('AssessmentID').inTable('Assessment');
      table.integer('UserID').notNullable().references('UserID').inTable('User');
      table.integer('preAssessmentCall').unsigned().notNullable().comment('Rate the pre-assessment call (1-5)');
      table.integer('organisationOfServiceAssessment').unsigned().notNullable().comment('Rate the organisation of the service assessment (1-5)');
      table.integer('runningOfAssessment').unsigned().notNullable().comment('Rate the running of the assessment on the day (1-5)');
      table.text('feedbackOnLowScores').comment('Elaborate on items scored between 1 and 3');
      table.text('specificFeedbackForAssessor').comment('Specific feedback for the assessor panel');
      table.text('furtherComments').comment('Any further comments or suggestions');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('SurveyData');
  };
  