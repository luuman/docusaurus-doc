# Checkov

This plugin allows you to scan you Terraform code to find misconfigurations before they're deployed.

* [Home page](https://www.checkov.io/)
* [Source code on Github](https://github.com/bridgecrewio/checkov)

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.56.54@2x.png" alt=""><figcaption></figcaption>

**Configuration options**

1. Name: This is Brainboard field to describe what this task is about.
2. Version: always points to the latest version to give you the latest security checks released.
3. Extra environment variables: variables that you can define here that will be used as environment variables in the execution shell.
4. Skip checks.
5. Ignore failure: this will put the task in a non-blocking failure, which means, the execution of the following stage will be triggered even if the task fails.
6. Require approval: means that this task will not be executed until approved by people added in the approvers' list.
   * The task remains blocked until all approvers added in the list approve it.
   *   When enabled, it allows you to add approvers to the list<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.25.53@2x (1).png" alt=""><figcaption></figcaption>
   * The approver has to be Brainboard user
7. API key (optional): If you have a paid subscription you can add your key and repository id.

**Sample output**

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.59.57@2x.png" alt=""><figcaption></figcaption>

The output includes clickable links that open the relevant documentation pages listed in the 'More Information' section.
