
// Global
var axios = require('axios');
const { updateSlackChannelID, getAssessmentById } = require('../models/assessmentModel');

const slackApiUrl = 'https://slack.com/api';
const token = process.env.SLACK_TOKEN;


exports.p_create_channel = async function (req, res) {

    const { AssessmentID } = req.body
    const user = req.session.data.User;

    const assessment = await getAssessmentById(AssessmentID);

    const channelName = "sas-panel-" + assessment.Name.toLowerCase()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-|-$/g, '');


    console.log(channelName)

    const message = 'Created channel for the ' + assessment.Name + ' ' + assessment.Phase.toLowerCase() + ' ' + assessment.Type.toLowerCase() + '.';

    const userID = await getUserIDByEmail(user.EmailAddress);

    const channelID = await createPrivateChannel(channelName, userID, userID, message);

    console.log('response from create channel')
    console.log(channelID)

    if (channelID !== undefined) {
        await updateSlackChannelID(AssessmentID, channelID);
    }
    return res.redirect('/admin/overview/' + AssessmentID);
}





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

        console.log(createChannelResponse);
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