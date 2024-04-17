<!-- 
Purpose: This sends a user an email with a magic link to access the service

Parameters

((serviceURL)) - The url of the service
((token)) - the unique token to validate the users sign in 

Template name: Magic link
Subject: Magic link for Service assessment service
-->

Use this link within the next 30 minutes to access the Service assessment service.

((serviceURL))/auth/t/((token))
