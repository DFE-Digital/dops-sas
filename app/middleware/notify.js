/**
 * Author:          Andy Jones - Department for Education
 * Description:     Utility functions for the service
 * GitHub Issue:
 */

const NotifyClient = require('notifications-node-client').NotifyClient
const notify = new NotifyClient(process.env.notifyKey)


/**
 * Send email using Notify
 * @param {string} template - template ID from Notify
 * @param {string} recipient - email address of recipient
 * @param {object} templateParams - template parameters
 * @returns {boolean} - true if email is sent, false if errors
 * Guidance: https://docs.notifications.service.gov.uk/node.html#send-an-email
 */
function sendNotifyEmail(template, recipient, templateParams) {

    console.log('Send email to:', recipient);
    try {

        const safeList = process.env.EmailSafeList.split(',');

        if (!safeList.includes(recipient)) {
            console.log(`Recipient ${recipient} is not in the safe list.`);
            return false;
        }


        console.log('Sending');

        return notify
            .sendEmail(template, recipient, {
                personalisation: templateParams
            })
            .then((response) => true)
            .catch((err) => {
                console.error("Error sending email:", err);
                if (err.response) {
                    console.log("Response status:", err.response.status);
                    console.log("Response headers:", err.response.headers);
                    console.log("Response data:", err.response.data);
                }
                return false;
            });

    } catch (err) {
        console.error(err);
    }
}


module.exports = {
    sendNotifyEmail
};