# Email

This plugin allows you to send an email to multiple emails.

This is Brainboard plugin.

![Email plugin](../../../.gitbook/assets/email-plugin.png)

**Configuration options**

1. Emails: list of email address that will receive a copy of the message.
2. Message: YAML content to be emailed.
3. Custom arguments.
4. Ignore failure: if enabled, the execution of the following stage will be triggered even if the task fails.
5. Require approval: means that this task will not be executed until approved by people added in the approvers' list.
   * The task remains blocked until all approvers added in the list approve it.
   *   When enabled, it allows you to add approvers to the list<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.25.53@2x (1).png" alt=""><figcaption></figcaption>
   * The approver has to be Brainboard user
