# Tfsec

This plugin allows you to scan the Terraform code with `tfsec` and provide output.

`tfsec` is a static analysis security scanner for your Terraform code.

* [Home page](https://aquasecurity.github.io/tfsec)
* [Source code on GitHub](https://github.com/aquasecurity/tfsec)

![TFSEC plugin](<../../../.gitbook/assets/CleanShot 2025-07-10 at 13.16.04@2x.png>)

**Configuration options**

1. Name: This is Brainboard field to describe what this task is about.
2. Version: always points to the latest version to give you the latest security checks released.
3. Extra environment variables: variables that you can define here that will be used as environment variables in the execution shell.
4. Disable grouping: disable grouping of similar results.
5. Ignore failure: this will put the task in a non-blocking failure, which means, the execution of the following stage will be triggered even if the task fails.
6. Include ignored: include ignored checks in the result output.
7. Include passed: include passed checks in the result output.
8. Require approval: means that this task will not be executed until approved by people added in the approvers' list.
   * The task remains blocked until all approvers added in the list approve it.
   *   When enabled, it allows you to add approvers to the list<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.25.53@2x (1).png" alt=""><figcaption></figcaption>
   * The approver has to be Brainboard user<br>
9. Minimum severity: you can specify the minimum severity of result that should be reported. By default, every severity is reported. You must use one of `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
10. Disabled checks: comma separated list of checks to exclude during the execution.
    1. This list has to be in this format: `rule1,rule2,rule3...`&#x20;
    2. No space is added after the comma in the list

**Sample output**

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.24.02@2x.png" alt=""><figcaption></figcaption>

The output includes clickable links that open the relevant documentation pages listed in the 'More Information' section.
