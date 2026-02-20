# How to use

### Push the code to Git (Pull Request)

A pull request is a way that allows you to push the generated Terraform code from Brainboard into your git repository.

It is similar to doing `git add .`, `git commit -m 'commit message'` and `git push` on your laptop.

#### How to do a Pull Request

When you do a pull request, Brainboard packages all the generated files for your infrastructure, does the pull request into the git repository that you configure and gives you back the link to the PR.

Here are important information on how it works:

1. You first have to setup the integration between Brainboard and your git repository. Refer to these pages to do the integration with:
   * [github.md](github.md "mention")
   * [ado.md](ado.md "mention")
   * [gitlab.md](gitlab.md "mention")
   * [bitbucket.md](bitbucket.md "mention")
2.  Select the Git credentials you want to associate to your architecture in the settings page of the architecture

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.54.35@2x.png" alt=""><figcaption></figcaption>

    You can also configure the Git repository, source and target branch, and the default files to be included in the PR:<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 18.00.27@2x.png" alt=""><figcaption></figcaption>
3.  In the design area, on the right, click on `Pull request` button<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.56.45@2x.png" alt=""><figcaption></figcaption>
4.  This will open the modal of the PR where you can customize the commit message, the title, description and also select the files you want/don't want to push to Git:<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 17.58.30@2x.png" alt=""><figcaption></figcaption>
5. Brainboard pushes only the difference between the branches, as it does git pull first before pushing.

### Import from Git

You can import your existing Terraform code from your repository directly in Brainboard.

To do so:

1. Click on `New architecture`&#x20;
2.  Select import from your infrastructure<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 18.04.45@2x.png" alt=""><figcaption></figcaption>
3.  Select `From Git repository` <br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 18.05.31@2x.png" alt=""><figcaption></figcaption>
4.  Select your Git provider<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 18.06.10@2x.png" alt=""><figcaption></figcaption>
5.  This will open the dedicate import page of your Git provider. In this example, Azure DevOps is open. You can select the Git credentials you want to use for this import<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 18.07.06@2x.png" alt=""><figcaption></figcaption>
6.  Once you select the Git credentials, Brainboard will scan your repository, and you can select the right project to import from, the branch and subfolders is needed<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-04-11 at 18.09.19@2x.png" alt=""><figcaption></figcaption>
7. You click on `Import` to initiate the import from Git.

### Best practices

1.  It's a best practice to push a clean code, so before you do a pull request, make sure that your architecture and the generated code is:

    * Working properly. Try to have at least a `plan` succeeding before doing a PR.
    * Respect your budget. Use Brainboard CI/CD engine to integrate costs into your pipeline of tests and make sure it's under budget.
    * Secure. Add security checks like TFSEC, Checkov and even policy as code like OPA into your pipelines.

    Refer to the CI/CD engine to know how to build your pipelines.
2. Rotate your personal git tokens regularly.
