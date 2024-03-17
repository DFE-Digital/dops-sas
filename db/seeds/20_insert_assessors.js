exports.seed = function(knex) {
    // Deletes ALL existing entries for the Assessor table
    return knex('Assessor').del()
      .then(function () {
        // Inserts seed entries for the Assessor table
        return knex('Assessor').insert([
          {
            AssessorID: 1, 
            UserID: 1, 
            PrimaryRole: 'Design assessor', 
            Active: true, 
            CrossGovAssessor: true, 
            ExternalAssessor: true, 
            LeadAssessor: true
          }
        ]);
      });
  };
  