# Microsoft Teams

This plugin allows you to send a notification to your MS Teams channel.

<img src="../../../.gitbook/assets/CleanShot 2025-02-13 at 14.07.43@2x.png" alt=""><figcaption></figcaption>

**Configuration options**

1. Task name: This name will be visible in the pipeline later when it is executed.
2. Title: title of the message that will be posted to the Teams channel.
3. Message: text to be sent.
4. Webhook URL of your MS Teams channel.
5. Hide pipeline URL: Do not add the button with link to the pipeline in the adaptive card of the message displayed in the Teams channel.
6. Ignore failure: if enabled, the execution of the following stage will be triggered even if the task fails.
7. Require approval: means that this task will not be executed until approved by people added in the approvers' list.
   * The task remains blocked until all approvers added in the list approve it.
   *   When enabled, it allows you to add approvers to the list<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.25.53@2x (1).png" alt=""><figcaption></figcaption>
   * The approver has to be Brainboard user

#### Setup instructions

If you want to configure Microsoft Teams to receive notifications from Brainboard pipelines, an _incoming hook_ needs to be set up in the channel of your choice. To do so, follow the steps:

1.  Go to your Teams channel where you want the notification to be posted and open its configuration menu in the top-right corner and click on "Workflows":<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-02-13 at 14.56.13@2x.png" alt=""><figcaption></figcaption>
2.  This will open the workflows configuration wizard. Search and select the line "Post to a channel when a webhook request is received":

    <img src="../../../.gitbook/assets/CleanShot 2025-02-13 at 14.56.30@2x.png" alt=""><figcaption></figcaption>
3.  Give it a name and click Next:<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-02-13 at 14.56.50@2x.png" alt=""><figcaption></figcaption>


4.  Select the channel where you want the notification to be posted:<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-02-13 at 14.57.07@2x.png" alt=""><figcaption></figcaption>
5.  Copy the generated webhook URL to use in Brainboard:<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-02-13 at 14.57.18@2x.png" alt=""><figcaption></figcaption>

If you have an old configuration, follow the steps of this video:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube.com/embed/LOvWCNyXxLE" title="YouTube video"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
  ></iframe>
</div>

:::warning
&#x20;That configuration is deprecated by Azure and will be removed by the end of 2025.
:::

