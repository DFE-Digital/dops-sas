// Global
const axios = require('axios');
const { updateSlackChannelID, getAssessmentById } = require('../models/assessmentModel');

const slackApiUrl = 'https://slack.com/api';
const token = process.env.SLACK_TOKEN;

/**
 * Retrieves a Slack user ID for a given email.
 * @param {string} email - The email address to look up.
 * @returns {Promise<string|undefined>} The user ID if found, otherwise undefined.
 */
async function getUserIDByEmail(email) {
    try {
        const response = await axios.get(`${slackApiUrl}/users.lookupByEmail`, {
            params: { email },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data?.ok) {
            const userId = response.data.user.id;
            console.log(`User ID for ${email}: ${userId}`);
            return userId;
        } else {
            console.error(`Error retrieving user ID for ${email}: ${response.data?.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Error retrieving user ID for ${email}: ${error?.response?.data?.error || error.message}`);
    }
}

/**
 * Tries to retrieve a user ID by the given email. If unsuccessful,
 * attempts to retrieve by replacing 'education.gov.uk' with 'digital.education.gov.uk'.
 * @param {string} email - The initial email to try.
 * @returns {Promise<string|undefined>} The user ID if found, otherwise undefined.
 */
async function resolveUserIdWithFallback(email) {
    let userId = await getUserIDByEmail(email);
    if (userId) return userId;

    const fallbackEmail = email.replace('education.gov.uk', 'digital.education.gov.uk');
    return await getUserIDByEmail(fallbackEmail);
}

/**
 * Posts a message about a newly added artefact to a Slack channel.
 * @param {string} channelId - The Slack channel ID.
 * @param {string} artefactName - The name of the artefact.
 * @param {string|number} assessmentID - The assessment ID associated with the artefact.
 * @returns {Promise<void>}
 */
async function postArtefactMessage(channelId, artefactName, assessmentID) {
    const artefactUrl = `${process.env.serviceURL}/manage/artefacts/${assessmentID}`;
    const message = `An artefact has been added\n\n*Title:* ${artefactName}\n\n<${artefactUrl}|Access the artefact> in the Service assessment service`;

    try {
        const response = await axios.post(
            `${slackApiUrl}/chat.postMessage`,
            {
                channel: channelId,
                text: message,
                mrkdwn: true
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data?.ok) {
            console.log(`Artefact message posted successfully to channel: ${channelId}`);
        } else {
            throw new Error(`Error posting artefact message: ${response.data?.error}`);
        }
    } catch (error) {
        console.error(`Error posting artefact message to channel ${channelId}: ${error?.response?.data?.error || error.message}`);
    }
}

/**
 * Invites a user to a Slack channel by their user ID.
 * @param {string} channelId - The Slack channel ID.
 * @param {string} userId - The Slack user ID.
 * @returns {Promise<void>}
 */
async function inviteUserToChannel(channelId, userId) {
    try {
        const response = await axios.post(
            `${slackApiUrl}/conversations.invite`,
            { channel: channelId, users: userId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.ok) {
            console.log(`User ${userId} invited successfully to the channel ${channelId}`);
        } else {
            throw new Error(`Failed to invite user to channel: ${response.data?.error}`);
        }
    } catch (error) {
        console.error(`Error inviting user ${userId} to channel ${channelId}: ${error?.response?.data?.error || error.message}`);
    }
}

/**
 * Adds a user to a Slack channel by their email, attempting a fallback domain if necessary.
 * @param {string} email - The user's email address.
 * @param {string} channelId - The Slack channel ID.
 * @returns {Promise<void>}
 */
async function addUserToChannelByEmail(email, channelId) {
    const userId = await resolveUserIdWithFallback(email);

    if (!userId) {
        console.log(`No user found for ${email} (including fallback domain)`);
        return;
    }

    await inviteUserToChannel(channelId, userId);
}

/**
 * Removes a user from a Slack channel by their email, attempting a fallback domain if necessary.
 * @param {string} email - The user's email address.
 * @param {string} channelId - The Slack channel ID.
 * @returns {Promise<void>}
 */
async function kickUserFromChannelByEmail(email, channelId) {
    console.log(`Attempting to remove user ${email} from channel ${channelId}`);

    try {
        let userId = await getUserIDByEmail(email);

        if (!userId) {
            const fallbackEmail = email.replace('education.gov.uk', 'digital.education.gov.uk');
            userId = await getUserIDByEmail(fallbackEmail);

            if (!userId) {
                console.error(`No user found with email ${email} or ${fallbackEmail}`);
                return;
            }
        }

        const response = await axios.post(
            `${slackApiUrl}/conversations.kick`,
            { channel: channelId, user: userId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.ok) {
            console.log(`User ${email} (${userId}) successfully removed from channel ${channelId}`);
        } else {
            throw new Error(`Failed to remove user from channel: ${response.data?.error}`);
        }
    } catch (error) {
        console.error(`Error removing user ${email} from channel ${channelId}: ${error?.response?.data?.error || error.message}`);
    }
}

/**
 * Posts a message to a Slack channel.
 * @param {string} channelId - The ID of the Slack channel.
 * @param {string} message - The message text.
 * @returns {Promise<void>}
 */
async function postMessageToSlack(channelId, message) {
    try {
        const response = await axios.post(
            `${slackApiUrl}/chat.postMessage`,
            { channel: channelId, text: message },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.ok) {
            console.log(`Message posted successfully to channel: ${channelId}`);
        } else {
            console.error(`Error posting message to channel ${channelId}: ${response.data?.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Error posting message to Slack channel ${channelId}: ${error?.response?.data?.error || error.message}`);
    }
}

module.exports = {
    postArtefactMessage,
    addUserToChannelByEmail,
    postMessageToSlack,
    kickUserFromChannelByEmail
};
