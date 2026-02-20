# GitHub

### Configure GitHub integration

To create integration between Brainboard and GitHub:

1. Go to the [Git integration](https://app.brainboard.co/settings/integrations/git) settings page.
2. Click on `Integrations`
3. Click on  `Connect with GitHub`

<img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 16.11.13@2x (1).png" alt=""><figcaption></figcaption>

You'll be redirected to the GitHub website, where you can choose the organization for which you want to configure access:&#x20;

<img src="../../../.gitbook/assets/github-first-page.png" alt=""><figcaption></figcaption>

After selecting the organization, you are prompted to specify the repositories:&#x20;

**N.B:** Brainboard requires `read-write` access to be able to do pull requests.

<img src="../../../.gitbook/assets/github-project-access.png" alt=""><figcaption></figcaption>

After selecting the repositories, you'll be automatically redirected to Brainboard Git app settings page. Now the button should have changed to `View GitHub integration`. &#x20;

:::note
Brainboard Enterprise SSO users: If your organization uses Brainboard Enterprise SSO for authentication, the redirection to Brainboard app will fail after selecting the repositories. In this case, please contact our support to update your GitHub `installation_id`.
:::

Once the connection is configured successfully, it will be you should it with a green indication

<img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 16.08.49@2x.png" alt=""><figcaption></figcaption>

### Enable personal connection

1.  Once the GitHub app integration is done you need to click on `Add connection` in `Personal connections` section. This will open the settings where you can allow Brainboard to do pull requests on your behalf by clicking on `Connect with Github`<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 16.47.00@2x.png" alt=""><figcaption></figcaption>

    If the Git app integration is not configured, Brainboard will display a warning as it has to be done first<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 16.11.41@2x.png" alt=""><figcaption></figcaption>
2.  The GitHub website will open in a new tab, asking you to authorize Brainboard app to access your GitHub account. Click on the `Authorize Brainboard` button:

    ![Github authorize](../../../.gitbook/assets/github-authorize-app.png)
3.  You will then be redirected to Brainboard personal git tokens page, with a confirmation that the GitHub connection was successful:

    ![Github\_connection\_success](../../../.gitbook/assets/github-connect-success.png)

### Edit GitHub integration

To edit the GitHub integration:

1. Go to the [Git integration](https://app.brainboard.co/settings/integrations/git) settings page.
2. Click on `Integrations`
3. Click on  `Access GitHub`
4. You'll be redirected to the GitHub website, where you can edit the integration with Brainboard.

### Delete GitHub integration

To delete integration with GitHub:

1. Go to the [Git integration](https://app.brainboard.co/settings/integrations/git) settings page.
2. Click on `Integrations`&#x20;
3.  You need to delete your personal connection first by clicking on it in the section `Personal connectio` then click on `Delete configuration`

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.40.54@2x.png" alt=""><figcaption></figcaption>
4. Go back to the page of Git connections and click on  `Access GitHub`
5.  You'll be redirected to the GitHub website, where you can delete the integration with Brainboard.<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 16.44.39@2x.png" alt=""><figcaption></figcaption>

:::note
The update will be immediate, and you will no longer be able to do pull requests.
:::
