const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Checks for a user by email and updates or sets their token and token expiry if they exist.
 * If the user does not exist, creates a new user with the given details and additional default fields.
 * @param {string} emailAddress The email address of the user.
 * @param {string} token The new token for the user.
 * @param {Date} tokenExpiry The expiry date and time for the new token.
 * @returns {Promise<number>} The user's ID if successful, or 0 if an error occurs.
 */
async function checkAndSetUserToken(emailAddress, token, tokenExpiry) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let res = await client.query('SELECT "UserID" FROM public."User" WHERE "EmailAddress" = $1', [emailAddress]);
    let userId;

    if (res.rows.length === 0) {
      // User does not exist, create a new user with additional fields
      const query = `
        INSERT INTO public."User"(
          "EmailAddress", 
          "Token", 
          "TokenExpiry", 
          "FirstName", 
          "LastName", 
          "CreatedBy", 
          "CreatedByProcess", 
          "AccountActive", 
          "Department"
        ) VALUES ($1, $2, $3, '', '', 0, 'Registration', true, 1) RETURNING "UserID"
      `;
      res = await client.query(query, [emailAddress, token, tokenExpiry]);
      userId = res.rows[0].UserID; // Assuming the table returns "UserID" upon insertion
    } else {
      // User exists, update their token and expiry
      userId = res.rows[0].UserID;
      await client.query('UPDATE public."User" SET "Token" = $2, "TokenExpiry" = $3 WHERE "EmailAddress" = $1', [emailAddress, token, tokenExpiry]);
    }

    await client.query('COMMIT');
    return userId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database query error in checkAndSetUserToken:', error);
    return 0;
  } finally {
    client.release();
  }
}


/**
 * Checks the validity of a token and returns the user details if the token is valid.
 * @param {string} token The token to check.
 * @returns {Promise<object|number>} The user's details if the token is valid, or 0 if it is not.
 */
async function checkToken(token) {
  try {
    const result = await pool.query(`
      SELECT "UserID", "EmailAddress", "FirstName", "LastName", "Department"
      FROM public."User"
      WHERE "Token" = $1 AND "TokenExpiry" > NOW()
    `, [token]);

    if (result.rows.length > 0) {
      console.log('User found:', result.rows[0]);
      return result.rows[0];
    } else {
      console.log('No valid record found for the given token.');
      return 0;
    }
  } catch (error) {
    console.error('Error in checkToken:', error);
    return 0;
  }
}

/**
 * Inserts or updates a user's details based on the email address.
 * @param {string} emailAddress The user's email address.
 * @param {string} firstName The user's first name.
 * @param {string} lastName The user's last name.
 * @param {string} createdBy The identifier for what created the user.
 * @param {string} createdByProcess The process by which the user was created.
 * @returns {Promise<number>} The ID of the upserted user.
 */
async function UpsertUserNoToken(emailAddress, firstName, lastName, createdBy, createdByProcess) {
  try {
    const { rows } = await pool.query(`
      INSERT INTO "User" ("EmailAddress", "FirstName", "LastName", "CreatedBy", "CreatedByProcess", "AccountActive", "Department")
      VALUES ($1, $2, $3, $4, $5, true, 1)
      ON CONFLICT ("EmailAddress")
      DO UPDATE SET
          "FirstName" = EXCLUDED."FirstName",
          "LastName" = EXCLUDED."LastName",
          "CreatedBy" = EXCLUDED."CreatedBy",
          "CreatedByProcess" = EXCLUDED."CreatedByProcess",
          "Department" = EXCLUDED."Department",
          "AccountActive" = EXCLUDED."AccountActive"
      RETURNING "UserID";
    `, [emailAddress, firstName, lastName, createdBy, createdByProcess]);

    return rows[0].UserID;
  } catch (error) {
    console.error('Error in UpsertUserNoToken:', error);
    throw error;
  }
}



/**
 * Fetches basic details of a user based on their user ID.
 * @param {number} userId The unique identifier of the user.
 * @returns {Promise<{EmailAddress: string, FirstName: string, LastName: string}|null>}
 */
async function getBasicUserDetails(userId) {
  try {
    const result = await pool.query(`
        SELECT "UserID", "EmailAddress", "FirstName", "LastName", "Department"
        FROM public."User"
        WHERE "UserID" = $1
      `, [userId]);

    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      console.log(`No user found with UserID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error in getBasicUserDetails:', error);
    throw error;
  }
}



/**
 * Updates the first and last name of a user based on their user ID.
 * @param {string} firstName The user's new first name.
 * @param {string} lastName The user's new last name.
 * @param {number} userId The unique identifier of the user.
 */
async function updateName(firstName, lastName, userId) {
  try {
    await pool.query(`
        UPDATE public."User"
        SET "FirstName" = $1, "LastName" = $2
        WHERE "UserID" = $3
      `, [firstName, lastName, userId]);
  } catch (error) {
    console.error('Error in updateName:', error);
    throw error;
  }
}

/**
 * Updates the email address of a user based on their user ID, if the new email address does not already exist.
 * @param {string} emailAddress The user's new email address.
 * @param {number} userId The unique identifier of the user.
 * @returns {Promise<boolean>} Returns true if the update was successful, false if the email address already exists.
 */
async function updateEmail(emailAddress, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the new email address already exists for a different user
    const emailExists = await client.query(`
      SELECT 1 FROM public."User"
      WHERE "EmailAddress" = $1 AND "UserID" <> $2
    `, [emailAddress, userId]);

    if (emailExists.rows.length > 0) {
      // Email address exists for another user, rollback and return false
      await client.query('ROLLBACK');
      return false;
    }

    // Proceed with the update since the email address does not exist for another user
    await client.query(`
      UPDATE public."User"
      SET "EmailAddress" = $1
      WHERE "UserID" = $2
    `, [emailAddress, userId]);

    await client.query('COMMIT');
    return true; // Update successful
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updateEmail:', error);
    throw error;
  } finally {
    client.release();
  }
}


module.exports = {
  UpsertUserNoToken, checkAndSetUserToken, checkToken, getBasicUserDetails, updateName, updateEmail
};