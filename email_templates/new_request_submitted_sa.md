<!-- 
Purpose: This sends an email to the service assessment team when a new request is submitted.

Parameters

((phase)) - The phase requested from the phase question in book journey
((type)) - The type requested from the type question in the book journey
((name)) - The name of the serivce, from the service name question in the book journey
((summary)) - The description of the service, from the description question in the book journey
((serviceURL)) - The url of the service
((id)) - the id of the assessment request

Template name: Email to SA+ team on submission
Subject: A ((phase)) ((type)) has been requested
-->

# Request for a ((phase)) ((type)) submitted

## Title 

((name ))

## Summary 

((summary))

## Manage your request online

You can view and accept or reject this request in the admin service at 

((serviceURL))/admin/entry/((id))
