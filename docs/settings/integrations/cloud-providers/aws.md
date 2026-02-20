# AWS

Brainboard allows you to connect to your AWS environments, whether you want to provision resources, import existing infrastructure or simply manage your architecture on a daily basis.

It supports 2 authentication methods described below:

1. [Assume role](aws.md#assume-role) (recommended)
2. [Access key and secret](aws.md#access-key-and-secret)

### Configure access

To connect Brainboard to your AWS account:

1. Go to the [Cloud providers integration](https://app.brainboard.co/settings/integrations/cloud-providers) settings page.
2. Click on `Amazon Web Services`&#x20;
3.  Click on `New connection`

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.08.28@2x.png" alt=""><figcaption></figcaption>
4.  This will open the new connection page where you have 2 options:<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.10.12@2x.png" alt=""><figcaption></figcaption>

### Assume role

:::tip
N.B: This is the recommended way to connect to your AWS accounts as it doesn't require any secret sharing.
:::

When you click on the option `Assume role` Brainboard guides you in the connection process:

1.  In this page, click on `Create role` button, it will open your AWS account with pre-filled information

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.27.48@2x.png" alt=""><figcaption></figcaption>
2.  In your AWS portal, review the configuration and click next

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.30.54@2x.png" alt=""><figcaption></figcaption>
3.  Select the right permission to grant for this connection<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.33.31@2x.png" alt=""><figcaption></figcaption>
4.  Give the role a name, review and click on create role at the bottom

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.34.37@2x.png" alt=""><figcaption></figcaption>
5.  Copy the ARN of the role<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.36.27@2x.png" alt=""><figcaption></figcaption>
6.  Add the ARN in Brainboard credentials creation page<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.38.47@2x.png" alt=""><figcaption></figcaption>
7. Brainboard checks if the connection can be established:
   1.  If the connection is successful, you will have this message

       <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.40.03@2x.png" alt=""><figcaption></figcaption>
   2.  If it fails, you get an information about it<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.25.27@2x.png" alt=""><figcaption></figcaption>
8.  Name the connection in Brainboard<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 15.44.47@2x.png" alt=""><figcaption></figcaption>

    This name is used only within Brainboard, so it's a best practice to give an explicit name that allows you to identify which account is referring to.

### Access key and secret

Brainboard allows you to add your access key, secret and session token if this is your preferred way to connect to your AWS environments:

<img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 18.27.45@2x.png" alt=""><figcaption></figcaption>

You need to generate the the access key and secret from your AWS account first.

<details>

<summary>Generate AWS access key and secret</summary>

1. Sign in to the AWS Management Console: Go to the AWS Management Console and sign in with your AWS account credentials.
2. Navigate to the IAM Console: In the console, search for “IAM” and select the IAM console.
3. Create a new user:\
   In the IAM console, choose “Users” from the navigation pane.\
   Click “Add user” to start creating a new user.\
   Provide a name for the user and check the box to give it access to the AWS Management Console.\
   If you prefer to give it programmatic access only, you can also do that.
4. Set permissions (Optional): You can attach policies to the user to grant specific permissions.
5. Create the access key:\
   Go to the “Security credentials” tab of the user.\
   Click “Create access key” under the “Access keys” section.\
   The Access Key ID and Secret Access Key will be displayed.
6. Save the keys: Save both the Access Key ID and Secret Access Key securely. You will not be able to retrieve the secret key again if you don’t save it at this point.

</details>

### Set the scope

Once your credentials are added you can specify where exactly they will be used

<img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 16.03.09@2x.png" alt=""><figcaption></figcaption>

This allows you to specify whether you want:

1. Make the credentials the default to use within your organization: which means any architecture created in Brainboard will use these credentials if it doesn't have its own ones.
2. Use in a specific project
3. Use in a specific environment
4. Use in a specific architecture

<img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 16.04.59@2x.png" alt=""><figcaption></figcaption>
