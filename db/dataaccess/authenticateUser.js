const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // For environments like Heroku; adjust as needed
});

async function checkAndSetUserToken(emailAddress, token, tokenExpiry) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query('SELECT "UserID" FROM public."User" WHERE "EmailAddress" = $1', [emailAddress]);
    if (res.rows.length === 0) {
      await client.query('ROLLBACK');
      return 0;
    }

    const userId = res.rows[0].UserID;
    await client.query('UPDATE public."User" SET "Token" = $2, "TokenExpiry" = $3 WHERE "EmailAddress" = $1', [emailAddress, token, tokenExpiry]);
    await client.query('COMMIT');

    return userId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function checkToken(token) {
  try {
    const queryText = `
      SELECT "UserID", "EmailAddress", "FirstName", "LastName"
      FROM public."User" 
      WHERE "Token" = $1 AND "TokenExpiry" > NOW()
    `;

    const result = await pool.query(queryText, [token]);

    if (result.rows.length > 0) {
      console.log(result.rows[0]);
      return result.rows[0]
    } else {
      console.log('No valid record found for the given token.');
      return 0;
    }
  } catch (error) {
    console.error('Error in checkToken:', error);
    return 0;
  }
}

module.exports = { checkAndSetUserToken, checkToken };
