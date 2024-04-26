const pool = require('./pool.js');

/**
 * Gets assessors
 * @param {number} departmentID The depaertment ID to filter assessors by.
 * @returns {Promise<Array>} An array of assessors, or an empty array if no assessors are found.
 */
async function getAllAssessors(departmentID) {
    try {
        const result = await pool.query(`
        SELECT a.*, u."FirstName", u."LastName", u."EmailAddress"
        FROM public."Assessor" a
        INNER JOIN public."User" u ON a."UserID" = u."UserID"
        WHERE a."DepartmentID" = $1
        ORDER BY a."PrimaryRole", u."FirstName";        
        `, [departmentID]);

        return result.rows;
    } catch (error) {
        console.error('Error in getAllAssessors:', error);
        return []; // Return an empty array in case of error
    }
}


/**
 * Adds an assessor to the database
 * 
 * @param {*} UserID 
 * @param {*} Role 
 * @param {*} CrossGovAssessor 
 * @param {*} LeadAssessor 
 * @param {*} ExternalAssessor 
 */
async function createAssessor(UserID, Role, CrossGovAssessor, LeadAssessor, ExternalAssessor, DepartmentID) {

    try {
        await pool.query(`
            INSERT INTO public."Assessor" ("UserID", "PrimaryRole", "Active","CrossGovAssessor", "LeadAssessor", "ExternalAssessor", "DepartmentID")
            VALUES ($1, $2, true, $3, $4, $5, $6)
        `, [UserID, Role, CrossGovAssessor, LeadAssessor, ExternalAssessor, DepartmentID]);
    } catch (error) {
        console.error('Error in createAssessor:', error);
        throw error;
    }

}


/**
 * Get assessor by assessorID
 * @param {number} assessorID The unique
 */
async function getAssessor(assessorID) {
    try {
        const result = await pool.query(`
            SELECT a.*, u."FirstName", u."LastName", u."EmailAddress"
            FROM public."Assessor" a
            INNER JOIN public."User" u ON a."UserID" = u."UserID"
            WHERE a."AssessorID" = $1
        `, [assessorID]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getAssessor:', error);
        return null;
    }
}


/**
 * Get assessor by userID
 * @param {number} userID The unique identifier of the user.
 */
async function getAssessorByUserID(userID) {
    try {
        const result = await pool.query(`
            SELECT a.*, u."FirstName", u."LastName", u."EmailAddress"
            FROM public."Assessor" a
            INNER JOIN public."User" u ON a."UserID" = u."UserID"
            WHERE a."UserID" = $1
        `, [userID]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getAssessorByUserID:', error);
        return null;
    }
}

/**
 * get training for a given userid
 * @param {number} userID The unique identifier of the user.
 */
async function getTrainingForUser(userID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."AssessorTraining"
            WHERE "UserID" = $1
        `, [userID]);

        return result.rows;
    } catch (error) {
        console.error('Error in getTrainingForUser:', error);
        return [];
    }
}

/**
 * Create training for a user
 * @param {number} userID The unique identifier of the user.
 * @param {string} training The training to add.
 * @param {date} date The date the training was completed.
 * @param {string} provider who did the training
 */
async function createTraining(userID, training, date, provider) {
    try {
        await pool.query(`
            INSERT INTO public."AssessorTraining" ("UserID", "Training", "Date", "Provider")
            VALUES ($1, $2, $3, $4)
        `, [userID, training, date, provider]);
    } catch (error) {
        console.error('Error in createTraining:', error);
        throw error;
    }
}

/**
 * Get training by unique ID
 * @param {UniqueID} uniqueID The unique identifier of the training.
 */
async function getTrainingByUniqueID(uniqueID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."AssessorTraining"
            WHERE "UniqueID" = $1
        `, [uniqueID]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getTrainingByUniqueID:', error);
        return {};
    }
}

/**
 * Delete training by unique ID
 * @param {UniqueID} uniqueID The unique identifier of the training.
 */
async function deleteTraining(uniqueID) {
    try {
        await pool.query(`
            DELETE FROM public."AssessorTraining"
            WHERE "UniqueID" = $1
        `, [uniqueID]);
    } catch (error) {
        console.error('Error in deleteTraining:', error);
        throw error;
    }
}

/**
 * Update assessor
 * @param {number} assessorID The unique
 * @param {boolean} Status The status
 */
async function updateAssessor(assessorID, Status) {
    try {
        await pool.query(`
            UPDATE public."Assessor"
            SET "Active" = $2
            WHERE "AssessorID" = $1
        `, [assessorID, Status]);
    } catch (error) {
        console.error('Error in updateAssessor:', error);
        throw error;
    }
}

/**
 * Update assessor
 * @param {number} assessorID The unique
 * @param {boolean} Status The status
 */
async function updateAssessorXGov(assessorID, Status) {
    try {
        await pool.query(`
            UPDATE public."Assessor"
            SET "CrossGovAssessor" = $2
            WHERE "AssessorID" = $1
        `, [assessorID, Status]);
    } catch (error) {
        console.error('Error in updateAssessorXGov:', error);
        throw error;
    }
}

/**
 * Update assessor
 * @param {number} assessorID The unique
 * @param {boolean} Status The status
 */
async function updateAssessorLead(assessorID, Status) {
    try {
        await pool.query(`
            UPDATE public."Assessor"
            SET "LeadAssessor" = $2
            WHERE "AssessorID" = $1
        `, [assessorID, Status]);
    } catch (error) {
        console.error('Error in updateAssessorLead:', error);
        throw error;
    }
}

/**
 * Update assessor
 * @param {number} assessorID The unique
 * @param {string} Role The role
 */
async function updateAssessorRole(assessorID, Role) {
    try {
        await pool.query(`
            UPDATE public."Assessor"
            SET "PrimaryRole" = $2
            WHERE "AssessorID" = $1
        `, [assessorID, Role]);
    } catch (error) {
        console.error('Error in updateAssessorRole:', error);
        throw error;
    }
}

/**
* Update assessor
* @param {number} assessorID The unique
* @param {boolean} Status The status
*/
async function updateAssessorExternal(assessorID, Status) {
   try {
       await pool.query(`
           UPDATE public."Assessor"
           SET "ExternalAssessor" = $2
           WHERE "AssessorID" = $1
       `, [assessorID, Status]);
   } catch (error) {
       console.error('Error in updateAssessorExternal:', error);
       throw error;
   }
}



module.exports = {
    getAllAssessors, createAssessor, getAssessor, getAssessorByUserID, getTrainingForUser, createTraining, getTrainingByUniqueID, deleteTraining, updateAssessor, updateAssessorXGov, updateAssessorLead, updateAssessorRole, updateAssessorExternal
};