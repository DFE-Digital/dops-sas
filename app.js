require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const compression = require('compression');
const appRoutes = require('./app/routes');
const nunjucks = require('nunjucks');
const expressWinston = require('express-winston');
const dateFilter = require('nunjucks-date-filter');
const logger = require('./config/winston');
const session = require('express-session');
const pg = require('pg');
const pgSession = require('connect-pg-simple')(session);

const app = express();

const { saveFormDataToSession, makeFormDataGlobal } = require('./app/middleware/session');

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
    'node_modules/dfe-frontend-alpha/packages/components',
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
  console.log(str)
  return str === null ? '-' : str
})

// If NA return NA for everything else, return the first character
nunjuckEnv.addFilter('OutcomeForGrid', function (str) {
  return str === 'NA' ? 'NA' : str.charAt(0)
})


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



app.set('view engine', 'html');


app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressWinston.logger({
  winstonInstance: logger,
}));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up middleware
app.use(saveFormDataToSession);
app.use(makeFormDataGlobal);


app.locals.debug = process.env.debug === 'true' ? true : false;
app.locals.staging = process.env.staging === 'true' ? true : false;
app.locals.serviceName = process.env.serviceName || 'Service Assessment Service';

app.use('/assets', express.static('public/assets'));

// Routes
app.use('/', appRoutes);

app.use(expressWinston.errorLogger({
  winstonInstance: logger,
}));

// Generic Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  console.log(err);
  res.status(500).send(err);
});

// Start server
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
