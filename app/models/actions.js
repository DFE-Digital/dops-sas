const pool = require('./pool.js');

/**
 * Get actions for an assessment
 */
async function getActionsForAssessmentID(assessmentID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Actions"
            WHERE "AssessmentID" = $1
            ORDER BY "Created" ASC
        `, [assessmentID]);

        // Return all rows (roles) instead of a single role
        return result.rows;
    } catch (error) {
        next('Error in getActionsForAssessmentID: ' + error);
        return []; 
    }
}

/**
 * Add an action to the database
 * AssessmentID, Standard, actionPlanItem, UserID
 *       table.string('Comments', 300).nullable();
      table.integer('Point').nullable();
      table.integer('CreatedBy').nullable();
      table.dateTime('Created').nullable();
      table.string('Status', 50).nullable();
      table.integer('AssignedTo').nullable();
      table.uuid('UniqueID').defaultTo(knex.raw('gen_random_uuid()')).nullable();
      table.dateTime('EstimatedResolutionDate').nullable();
* Estimated resoluton date should be created + 3 months
 */
async function addAction(AssessmentID, Standard, actionPlanItem, UserID) {
    try {
        await pool.query(`
            INSERT INTO public."Actions" ("AssessmentID", "Point", "Comments", "CreatedBy", "Created", "Status", "EstimatedResolutionDate")
            VALUES ($1, $2, $3, $4, NOW(), 'Open', NOW() + interval '3 months')
        `, [AssessmentID, Standard, actionPlanItem, UserID]);
    }
    catch (error) {
        console.error('Error in addAction:', error);
        throw error;
    }   
}

/**
 * Get action by unique ID
 * @param {uuid} uniqueID The unique identifier of the action.
 */
async function getActionByUniqueID(uniqueID) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Actions"
            WHERE "UniqueID" = $1
        `, [uniqueID]);

        return result.rows[0];
    } catch (error) {
        console.error('Error in getActionByUniqueID:', error);
        return {}; // Return an empty object in case of error
    }

}

/**
 * Update action by UUID
 * @param {uuid} uniqueID The unique identifier of the action.
 */
async function updateAction(uniqueID, comments) {
    try {
        await pool.query(`
            UPDATE public."Actions"
            SET "Comments" = $2
            WHERE "UniqueID" = $1
        `, [uniqueID, comments]);
    } catch (error) {
        console.error('Error in updateAction:', error);
        throw error;
    }
}


/**
 * Delete action by UUID
 * @param {uuid} uniqueID The unique identifier of the action.
 */
async function deleteAction(uniqueID) {
    try {
        await pool.query(`
            DELETE FROM public."Actions"
            WHERE "UniqueID" = $1
        `, [uniqueID]);
    } catch (error) {
        console.error('Error in deleteAction:', error);
        throw error;
    }
}

/**
 * Get actions for an assessment and standard
 */
async function getActionsForAssessmentIDAndStandard(assessmentID, standard) {
    try {
        const result = await pool.query(`
            SELECT *
            FROM public."Actions"
            WHERE "AssessmentID" = $1 AND "Point" = $2
        `, [assessmentID, standard]);

        // Return all rows (roles) instead of a single role
        return result.rows;
    } catch (error) {
        console.error('Error in getActionsForAssessmentIDAndStandard:', error);
        return []; // Return an empty array in case of error
    }
}


module.exports = {
    getActionsForAssessmentID, addAction, getActionByUniqueID, updateAction, deleteAction, getActionsForAssessmentIDAndStandard
};