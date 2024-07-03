
// Global
var axios = require('axios');
const { updateSlackChannelID, getAssessmentById } = require('../models/assessmentModel');

const slackApiUrl = 'https://slack.com/api';
const token = process.env.SLACK_TOKEN;

async function getUserIDByEmail(email) {
    try {
        const response = await axios.get(`${slackApiUrl}/users.lookupByEmail`, {
            params: {
                email: email
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data.ok) {
            const userId = response.data.user.id;
            console.log(`User ID for ${email}: ${userId}`);
            return userId;
        } else {
            console.error('Error retrieving user ID:', response);
        }
    } catch (error) {
        console.error('Error retrieving user ID:', error.data.error);
    }
}

async function postArtefactMessage(channelId, artefactName, assessmentID) {
    const artefactUrl = `http://localhost:3000/manage/artefacts/${assessmentID}`;
    const message = `An artefact has been added\n\n*Title:* ${artefactName}\n\n<${artefactUrl}|Access the artefact> in the Service assessment service`;
    
    try {
        const response = await axios.post(
            `${slackApiUrl}/chat.postMessage`,
            {
                channel: channelId,
                text: message,
                mrkdwn: true  // Enable Markdown formatting
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.ok) {
            console.log('Artefact message posted successfully to channel:', channelId);
        } else {
            throw new Error(`Error posting artefact message: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error posting message to Slack:', error);
    }
}


async function addUserToChannelByEmail(email, channelId) {
    let userId = await getUserIDByEmail(email);
    if (userId) {
        await inviteUserToChannel(channelId, userId);
    } else {

        // Try but replace education.gov.uk with digital.education.gov.uk
        const newEmail = email.replace('education.gov.uk', 'digital.education.gov.uk');

        userId = await getUserIDByEmail(newEmail);

        if (userId) {
            await inviteUserToChannel(channelId, userId);
        } else {

    
            console.log(`No user found with email ${newEmail}`);
        }
    }
}


async function inviteUserToChannel(channelId, userId) {
    try {
        const response = await axios.post(
            `${slackApiUrl}/conversations.invite`,
            {
                channel: channelId,
                users: userId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.ok) {
            console.log('User invited successfully to the channel');
        } else {
            throw new Error(`Failed to invite user to channel: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error inviting user to channel:', error);
    }
}

module.exports = {
    postArtefactMessage, addUserToChannelByEmail
};
