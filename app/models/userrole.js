const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


/**
 * Fetches roles for a userID
 * @param {number} userId The unique identifier of the user.
 * @returns {Promise<Array>} An array of the user's roles, or an empty array if no roles are found.
 */
async function getRolesByUserID(userId) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."UserRole"
            WHERE "UserID" = $1
        `, [userId]);

        // Return all rows (roles) instead of a single role
        return result.rows;
    } catch (error) {
        console.error('Error in getRolesByUserID:', error);
        return []; // Return an empty array in case of error
    }
}

/**
 * Fetches all admins from the UserRole table where UserRole is Administrator or Department lead, inner join the user table to get the user's name and email address where the user.Department is the Department parameter from user table
 * @param {number} department The department of the admin.
 * 
 * @returns {Promise<Array>} An array of the admins, or an empty array if no admins are found.
 */
async function getAllAdmins(department) {
    try {
        const result = await pool.query(`
            SELECT "User"."FirstName", "User"."LastName", "User"."EmailAddress", "UserRole"."UserRole", "UserRole"."UserRoleID", "UserRole"."UserID"
            FROM public."UserRole"
            INNER JOIN public."User" ON "UserRole"."UserID" = "User"."UserID"
            WHERE "UserRole" = 'Administrator' OR "UserRole" = 'Department lead' AND "User"."Department" = $1
        `, [department]);

        return result.rows;
    } catch (error) {
        console.error('Error in getAllAdmins:', error);
        return []; // Return an empty array in case of error
    }
}

/**
 * Adds an admin to the UserRole table FirstName, LastName, EmailAddress, department number, createAsLead, createdByUserID
 * Check if the email address is in the User table, if the User exists, get the ID and create a UserRole record with the UserID and the given role
 * If the User does not exist for the amail address, create a User, get the User ID and create a UserRole record with the UserID and the given role
 * Also, check is a UserRole record exists for the given UserID if it does, don't create the UserRole
 * 
 */
async function addAdmin(firstName, lastName, emailAddress, department, createAsLead, createdByUserID) {
    const client = await pool.connect();

    // if createAsLead is Yes, set the role to Department lead, otherwise Administrator
    const role = createAsLead === 'Yes' ? 'Department lead' : 'Administrator';

    try {
        await client.query('BEGIN');

        // Check if the user already exists
        const userExists = await client.query(`
            SELECT "UserID"
            FROM public."User"
            WHERE "EmailAddress" = $1
        `, [emailAddress]);

        let userId;
        if (userExists.rows.length > 0) {
            userId = userExists.rows[0].UserID;
        } else {
            // Create a new user
            const newUser = await client.query(`
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
          `, [emailAddress, firstName, lastName, createdByUserID, 'Add Admin']);


            userId = newUser.rows[0].UserID;
        }

        // Check if the user already has the role
        const userRoleExists = await client.query(`
            SELECT 1
            FROM public."UserRole"
            WHERE "UserID" = $1
        `, [userId]);

        if (userRoleExists.rows.length === 0) {
            // Add the user role
            await client.query(`
                INSERT INTO public."UserRole" ("UserID", "UserRole", "CreatedBy")
                VALUES ($1, $2, $3)
            `, [userId, role, createdByUserID]);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in addAdmin:', error);
        throw error;
    } finally {
        client.release();
    }
}

/** 
 * get admin by role id and department
 * @param {number} userRoleID The unique identifier of the role.
 * @param {number} department The department of the admin.
 * We need the department as we only want to return admins from the same department as the user
 */
async function getAdminByRoleID(department, userRoleID) {
    try {
        const result = await pool.query(`
            SELECT "User"."FirstName", "User"."LastName", "User"."EmailAddress", "UserRole"."UserRole", "UserRole"."UserRoleID"
            FROM public."UserRole"
            INNER JOIN public."User" ON "UserRole"."UserID" = "User"."UserID"
            WHERE "UserRoleID" = $1 AND "User"."Department" = $2
        `, [userRoleID, department]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getAdminByRoleID:', error);
        return null; // Return null in case of error
    }
}

/** 
 * Delete an admin by dept id and role id, and current userID
 * @param {number} userRoleID The unique identifier of the role.
 * @param {number} department The department of the admin.
 * @param {number} userID The unique identifier of the user.
 * We need the department as we only want to return admins from the same department as the user
 * And the userID to check the user has permission to delete the admin
 * and we need to not allow the user to delete themselves (check the userID is not the same as the UserID of the userrole)
 */
async function deleteAdmin(userRoleID, department, userID) {
    try {
        await pool.query(`
            DELETE FROM public."UserRole"
            WHERE "UserRoleID" = $1 AND "UserID" != $2
        `, [userRoleID, userID]);
    } catch (error) {
        console.error('Error in deleteAdmin:', error);
        throw error;
    }
}

/**
 * Get role by UserID
 * @param {number} userId The unique identifier of the user.
 */
async function getRoleByUserID(userId) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."UserRole"
            WHERE "UserID" = $1
        `, [userId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getRoleByUserID:', error);
        return null; // Return null in case of error
    }
}


module.exports = {
    getRolesByUserID, getAllAdmins, addAdmin, getAdminByRoleID, deleteAdmin, getRoleByUserID
};