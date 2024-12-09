
// Global
var axios = require('axios');
const { updateSlackChannelID, getAssessmentById } = require('../models/assessmentModel');
const { assessmentPanel } = require("../models/assessmentPanel");
const { getAssessorByUserID } = require('../models/assessors');
const { postMessageToSlack }  = require('../models/slack');

const slackApiUrl = 'https://slack.com/api';
const token = process.env.SLACK_TOKEN;


exports.p_create_channel = async function (req, res) {

    const { AssessmentID } = req.body
    const user = req.session.data.User;

    const assessment = await getAssessmentById(AssessmentID);

    const channelName = "sas-" + assessment.Name.toLowerCase()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-|-$/g, '');


    console.log(channelName)

    const message = 'Created channel for the ' + assessment.Name + ' ' + assessment.Phase.toLowerCase() + ' ' + assessment.Type.toLowerCase() + '.';

    const userID = await getUserIDByEmail(user.EmailAddress);

    const channelID = await createPrivateChannel(channelName, userID, userID, message);

    console.log('response from create channel')
    console.log(channelID)

    // Get assessors and add them to the channel as members

    const assessors = await assessmentPanel(AssessmentID);

    console.log('Assessors:')
    console.log(assessors)

    // For each assessor, invite them to the channel
    try {
        for (const assessor of assessors) {
            // Get the user email for the assessor

            let assessorInfo = await getAssessorByUserID(assessor.UserID);

            const assessorID = await getUserIDByEmail(assessorInfo.EmailAddress);
            await axios.post(
                `${slackApiUrl}/conversations.invite`,
                {
                    channel: channelID,
                    users: assessorID
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error inviting user:', error);
    }

    // Post a message to the channel

    const updateMessage = 'View more details in the Service assessment service: '+ process.env.serviceURL +'/assess/overview/' + AssessmentID;
    await postMessageToSlack(channelID, updateMessage);



    if (channelID !== undefined) {
        await updateSlackChannelID(AssessmentID, channelID);
    }
    return res.redirect('/admin/overview/' + AssessmentID);
}





async function getUserIDByEmail(email) {
    try {
        console.log('Looking up email:', email);
        let response = await axios.get(`${slackApiUrl}/users.lookupByEmail`, {
            params: { email },
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response?.data?.ok) {
            return response.data.user.id;
        } else {
            console.log(`Email ${email} not found, trying fallback...`);
            const newEmail = email.replace('@education.gov.uk', '@digital.education.gov.uk');
            response = await axios.get(`${slackApiUrl}/users.lookupByEmail`, {
                params: { email: newEmail },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response?.data?.ok) {
                return response.data.user.id;
            }
            console.error('Fallback email also failed:', response?.data?.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error retrieving user ID:', error?.response?.data?.error || error.message);
    }
}

async function createPrivateChannel(channelName, userId, ownerId, message) {

    var channelId = ""

    try {
        // Step 1: Create the private channel
        const createChannelResponse = await axios.post(
            `${slackApiUrl}/conversations.create`,
            {
                name: channelName,
                is_private: true
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        channelId = createChannelResponse.data.channel.id;

    } catch (error) {
        console.error('Error creating private channel:', error);
    }


    try {
        // Step 2: Invite the user to the private channel
        await axios.post(
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
    } catch (error) {
        console.error('Error inviting user:', error);
    }

    try {
        // Step 3: Set the owner of the private channel
        await axios.post(
            `${slackApiUrl}/conversations.setPurpose`,
            {
                channel: channelId,
                purpose: `Ownership transfer to <@${ownerId}>`
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    } catch (error) {
        console.error('Error setting purpose:', error);
    }

    try {
        await axios.post(
            `${slackApiUrl}/conversations.setOwner`,
            {
                channel: channelId,
                user: ownerId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );



    } catch (error) {
        console.error('Error setting owner:', error);
    }



    try {
        const response = await axios.post(
            `${slackApiUrl}/chat.postMessage`,
            {
                channel: channelId,
                text: message
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data) {
            console.log('Message posted successfully.');
        } else {
            console.error('Error posting message:', response.data.error);
        }
    } catch (error) {
        console.error('Error posting message:', error.response.data);
    }

    return channelId;
}