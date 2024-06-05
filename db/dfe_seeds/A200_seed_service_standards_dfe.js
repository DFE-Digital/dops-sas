exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('ServiceStandards').del()
      .then(function() {
          // Inserts seed entries
          return knex('ServiceStandards').insert([{
                  Point: 1,
                  Title: 'Understand users and their needs',
                  Assessors: 'User research, Design',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/1-understand-user-needs'
              },
              {
                  Point: 2,
                  Title: 'Solve a whole problem for users',
                  Assessors: 'Design, User research',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/2-solve-a-whole-problem'
              },
              {
                  Point: 3,
                  Title: 'Provide a joined up experience across all channels',
                  Assessors: 'Design, User research',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/3-join-up-across-channels'
              },
              {
                  Point: 4,
                  Title: 'Make the service simple to use',
                  Assessors: 'Design, User research',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/4-make-the-service-simple-to-use'
              },
              {
                  Point: 5,
                  Title: 'Make sure everyone can use the service',
                  Assessors: 'User research, Design, Accessibility',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/5-make-sure-everyone-can-use-the-service'
              },
              {
                  Point: 6,
                  Title: 'Have a multidisciplinary team',
                  Assessors: 'Lead',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/6-have-a-multidisciplinary-team'
              },
              {
                  Point: 7,
                  Title: 'Use agile ways of working',
                  Assessors: 'Lead',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/7-use-agile-ways-of-working'
              },
              {
                  Point: 8,
                  Title: 'Iterate and improve frequently',
                  Assessors: 'Lead, Design, User research',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/8-iterate-and-improve-frequently'
              },
              {
                  Point: 9,
                  Title: 'Create a secure service which protects users’ privacy',
                  Assessors: 'Info security, Tech',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/9-create-a-secure-service'
              },
              {
                  Point: 10,
                  Title: 'Define what success looks like and publish performance data',
                  Assessors: 'Performance analyst, Lead',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/10-define-success-publish-performance-data'
              },
              {
                  Point: 11,
                  Title: 'Choose the right tools and technology',
                  Assessors: 'Tech, Design',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/11-choose-the-right-tools-and-technology'
              },
              {
                  Point: 12,
                  Title: 'Make new source code open',
                  Assessors: 'Tech',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/12-make-new-source-code-open'
              },
              {
                  Point: 13,
                  Title: 'Use and contribute to open standards, common components and patterns',
                  Assessors: 'Design, Tech',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/13-use-common-standards-components-patterns'
              },
              {
                  Point: 14,
                  Title: 'Operate a reliable service',
                  Assessors: 'Tech, Lead',
                  Url: 'https://apply-the-service-standard.education.gov.uk/service-standard/14-operate-a-reliable-service'
              }
          ]);
      });
};