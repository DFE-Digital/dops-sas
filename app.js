require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const compression = require('compression');
const appRoutes = require('./app/routes');
const nunjucks = require('nunjucks');
const expressWinston = require('express-winston');
const winston = require('winston');
const dateFilter = require('nunjucks-date-filter');
const session = require('express-session');
const pg = require('pg');
const pgSession = require('connect-pg-simple')(session);
const airtable = require('airtable');
const base = new airtable({ apiKey: process.env.airtableFeedbackKey }).base(process.env.airtableFeedbackBase);

const app = express();

const { saveFormDataToSession, makeFormDataGlobal } = require('./app/middleware/session');
const { sendNotifyEmail } = require("./app/middleware/notify");

const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'sessions'
  }),
  secret: process.env.sessionkey,
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 }
}));

var nunjuckEnv = nunjucks.configure(
  [
    'app/views',
    'node_modules/govuk-frontend/dist/',
    'node_modules/dfe-frontend/packages/components',
  ],
  {
    autoescape: true,
    express: app,
  },
)

nunjuckEnv.addFilter('date', dateFilter)

nunjuckEnv.addFilter('split', function (str, seperator) {
  return str.split(seperator);
});

nunjuckEnv.addFilter('BoolToYesNo', function (str) {
  return str ? 'Yes' : 'No'
})

nunjuckEnv.addFilter('BoolToYesBlank', function (str) {
  return str ? 'Yes' : '-'
})

nunjuckEnv.addFilter('BoolToActiveInactive', function (str) {
  return str ? 'Active' : 'Inactive'
})

// Create a filter so that if the string is NA it returns Not assessed
nunjuckEnv.addFilter('NAToString', function (str) {
  return str === 'NA' ? 'Not assessed' : str
})

nunjuckEnv.addFilter('blankToNA', function (str) {
  return str === null ? '-' : str
})

// If NA return NA for everything else, return the first character
nunjuckEnv.addFilter('OutcomeForGrid', function (str) {
  return str === 'NA' ? 'NA' : str.charAt(0)
})


nunjuckEnv.addFilter('filterByProperty', function (array, propName, propValue) {
  return array.filter(item => item[propName] === propValue);
});

nunjuckEnv.addFilter('andify', function (input) {
  const values = input.split(', ');
  if (values.length >= 2) {
    const lastTwoValues = values.slice(-2).join(' and ');
    const remainingValues = values.slice(0, -2);
    return [...remainingValues, lastTwoValues].join(', ');
  } else {
    return input;
  }
});

nunjuckEnv.addFilter('toFixed', function (num, digits) {
  return parseFloat(num).toFixed(digits);
});


app.set('view engine', 'html');


app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up middleware
app.use(saveFormDataToSession);
app.use(makeFormDataGlobal);


app.locals.debug = process.env.debug === 'true' ? true : false;
app.locals.staging = process.env.staging === 'true' ? true : false;
app.locals.serviceName = process.env.serviceName || 'Service Assessment Service';
app.locals.slackURL = process.env.slackURL;

app.use('/assets', express.static('public/assets'));

// Serve documentation files
app.use('/docs', express.static('docs', { 
  index: 'index.html'
}));


// Route for handling Yes/No feedback submissions
app.post('/form-response/helpful', (req, res) => {
  const { response } = req.body;
  const service = "Service assessment service";
  const pageURL = req.headers.referer || 'Unknown';
  const date = new Date().toISOString();

  base('Data').create([
    {
      "fields": {
        "Response": response,
        "Service": service,
        "URL": pageURL
      }
    }
  ], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Error saving to Airtable');
    }
    res.json({ success: true, message: 'Feedback submitted successfully' });
  });
});

// New route for handling detailed feedback submissions
app.post('/form-response/feedback', (req, res) => {
  const { response, SID } = req.body;


  const service = "Service assessment service";
  const pageURL = req.headers.referer || 'Unknown';
  const date = new Date().toISOString();

  console.log(SID)

  base('Feedback').create([{
    "fields": {
      "Feedback": response,
      "Service": service,
      "URL": pageURL,
      "UserID": SID
    }
  }], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Error saving to Airtable');
    }
    res.json({ success: true, message: 'Feedback submitted successfully' });
  });
});

// Routes
app.use('/', appRoutes);




app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    })
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. 
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true.
  colorize: false,
  ignoreRoute: function (req, res) { return req.url.startsWith('/assets'); } // Function to determine if logging is skipped
}));

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});


// Generic Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);  // Log the error stack
  res.status(500).send('Something went wrong, DesignOps have been notified!');
});


// Start server
const port = process.env.PORT || 3921;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
