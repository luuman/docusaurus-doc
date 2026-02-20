# GitLab

### Add Git connection

To add GitLab personal Git token in Brainboard, you first need to generate it in your GitLab account.

<details>

<summary>Steps to generate a personal Git token on your GitLab account.</summary>

1. Go to your GitLab[ personal tokens page](https://gitlab.com/-/profile/personal_access_tokens).
2.  Add a name and specify `API` rights, then click on `Create personal access token` button:<br>

    <img src="../../../.gitbook/assets/image (4) (1).png" alt=""><figcaption></figcaption>
3.  The token is generated, you can copy it to add to Brainboard:<br>

    <img src="../../../.gitbook/assets/image (1) (1) (1).png" alt=""><figcaption></figcaption>

</details>

To add the generated token in Brainboard:

1. Go to the [Git integration](https://app.brainboard.co/settings/integrations/git) settings page.
2. Click on `Integrations`
3. In the section `Personal connections` Click on `Add connection`&#x20;
4.  Select `GitLab` tab<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.37.53@2x.png" alt=""><figcaption></figcaption>
5. Add your credentials in the displayed window:
   * Name of the token. This is only for Brainboard, it will not be used when you do a pull request.
   * The URL of your GitLab server: by default Brainboard uses `https://gitlab.com`, but if you have a private Gitlab instance accessible through the internet or if you use a single-tenant Brainboard offering, you can specify a different URL.
6. Then click on `Save and close` button.
7. Brainboard will verify if the credentials are valid:
   1.  If they are valid, Brainboard displays a success message and you can see the integration now in the Git connection page<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.07.55@2x.png" alt=""><figcaption></figcaption>
   2.  If they are not, you'll receive an error about what is wrong. For example:<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.00.18@2x.png" alt=""><figcaption></figcaption>

       <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.03.42@2x.png" alt=""><figcaption></figcaption>

### How to use

Please refer to the page [pull-requests.md](pull-requests.md "mention") to understand how you can use your git connections whether you want to do a pull request and import your code from Git.

### Edit or delete connection

1. Go to the [Git integration](https://app.brainboard.co/settings/integrations/git) settings page.
2. Click on `Integrations`
3. In the section `Personal connections` Click on `GitLab` integration that you want to edit or delete
4. Select the action you want to perform from the view

<img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.43.15@2x.png" alt=""><figcaption></figcaption>
