# GCP

Brainboard allows you to connect to your GCP environments, whether you want to provision resources, import existing infrastructure or simply manage your architecture on a daily basis.

### Configure access

To connect Brainboard to your GCP account:

1. Go to the [Cloud providers integration](https://app.brainboard.co/settings/integrations/cloud-providers) settings page.
2. Click on `Google Cloud Platform`
3.  Click on `New connection`

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.14.55@2x.png" alt=""><figcaption></figcaption>
4.  This will open the new connection page where you can add your project id and upload your JSON file for your credentials&#x20;

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.16.04@2x.png" alt=""><figcaption></figcaption>

### Generate GCP credentials

:::note
To generate GCP credentials, you will need to create a service account in the Google Cloud Console.&#x20;
:::

Here are the steps to generate GCP credentials:

1. Go to the Google Cloud Console (https://console.cloud.google.com) and select your project.
2. In the navigation menu, click on the hamburger icon (≡) and then select "IAM & admin" and then "Service accounts"
3. Click on the "Create Service Account" button.
4. In the "Create service account" form, give a name to the service account and provide a brief description.
5. Under "Role", select the role that you want to assign to the service account. This role will determine the actions that Terraform can perform with the service account.
6. Click on "Create" to create the service account.
7. Once the service account is created, you will see the option to create a key. Select "JSON" as the key type and click on "Create"
8. The JSON key file will be downloaded to your local machine. This file contains the credentials for the service account and it should be kept secure.
9. Once you have the JSON key file, you can use it to authenticate the Terraform GCP Provider to GCP.

### Set the scope

Once your credentials are added you can specify where exactly they will be used

<img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.21.52@2x.png" alt=""><figcaption></figcaption>

This allows you to specify whether you want:

1. Make the credentials the default to use within your organization: which means any architecture created in Brainboard will use these credentials if it doesn't have its own ones.
2. Use in a specific project
3. Use in a specific environment
4. Use in a specific architecture

<img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.03.39@2x (1).png" alt=""><figcaption></figcaption>
