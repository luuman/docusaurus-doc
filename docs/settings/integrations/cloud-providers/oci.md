# OCI

Brainboard allows you to connect to your OCI environments, whether you want to provision resources, import existing infrastructure or simply manage your architecture on a daily basis.

### Configure access

To connect Brainboard to your OCI account:

1. Go to the [Cloud providers integration](https://app.brainboard.co/settings/integrations/cloud-providers) settings page.
2. Click on `Oracle Cloud Infrastructure`
3.  Click on `New connection`<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.30.30@2x.png" alt=""><figcaption></figcaption>
4.  This will open the new connection page where you can add the following information

    <img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.31.40@2x.png" alt=""><figcaption></figcaption>

* The tenancy\_ocid variable specifies the OCID of the tenancy that you want to use. You can find your tenancy OCID in the Oracle Cloud Infrastructure Console under the "Tenancy Information" section.
* The user\_ocid variable specifies the OCID of the user to use. You can find your user OCID in the Oracle Cloud Infrastructure Console under the "User Settings" section.
* The fingerprint variable specifies the fingerprint of the public key that you have added to your user. You can find your public key fingerprint in the Oracle Cloud Infrastructure Console under the "User Settings" section.
* The private\_key variable specifies the path to the private key file that corresponds to the public key that you have added to your user. This private key will be used to sign the requests to the OCI API.

### Generate OCI credentials

To generate Oracle Cloud Infrastructure (OCI) credentials, you can use the OCI Console or the OCI CLI.

1. Using OCI Console:
2. Log in to the OCI Console
3. Go to the Identity service
4. Select Users from the navigation menu
5. Click on the "Create User" button
6. Enter a username, select "Programmatic" for the access type and then click on "Create"
7. Click on the username of the user you just created
8. Click on the "Create API Key" button

Click on the "Download" button to download the private key in PEM format

### Set the scope

Once your credentials are added you can specify where exactly they will be used

<img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.35.09@2x.png" alt=""><figcaption></figcaption>

This allows you to specify whether you want:

1. Make the credentials the default to use within your organization: which means any architecture created in Brainboard will use these credentials if it doesn't have its own ones.
2. Use in a specific project
3. Use in a specific environment
4. Use in a specific architecture

<img src="../../../.gitbook/assets/CleanShot 2025-04-24 at 17.03.39@2x.png" alt=""><figcaption></figcaption>
