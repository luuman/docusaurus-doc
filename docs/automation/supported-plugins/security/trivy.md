# Trivy

This plugin allows you to scan the Terraform code with `trivy` and provide output.

`trivy` is a static analysis security scanner that can be used for Terraform code.

* [Home page](https://trivy.dev/latest/docs/coverage/iac/terraform/)
* [Source code on GitHub](https://github.com/aquasecurity/trivy)

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.35.49@2x.png" alt=""><figcaption></figcaption>

**Configuration options**

1. Name: This is Brainboard field to describe what this task is about.
2. Version: always points to the latest version to give you the latest security checks released.
3. Extra environment variables: variables that you can define here that will be used as environment variables in the execution shell.
4. Ignore status: list of vulnerability status to ignore:
   1. `unknown`
   2. `not_affected`
   3. `affected`
   4. `fixed`
   5. `under_investigation`
   6. `will_not_fix`
   7. `fix_deferred`
   8. `end_of_life`
5. Scanners: list of what security issues to detect:
   1. `vuln`
   2. `misconfig`
   3. `secret`
   4. `license`
6. Severity: severities of security issues to be displayed:
   1. `UNKNOWN`
   2. `LOW`
   3. `MEDIUM`
   4. `HIGH`
   5. `CRITICAL`
7. Ignore failure: if enabled, the execution of the following stage will be triggered even if the task fails.
8. Offline scan: do not issue API requests to identify dependencies
9. Require approval: means that this task will not be executed until approved by people added in the approvers' list.
   * The task remains blocked until all approvers added in the list approve it.
   *   When enabled, it allows you to add approvers to the list<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.25.53@2x (1).png" alt=""><figcaption></figcaption>
   * The approver has to be Brainboard user
10. Config: can be used to pass any valid Trivy configuration page (see [documentation](https://trivy.dev/latest/docs/references/configuration/config-file/))
11. Skip files: specify the files or glob patterns to skip

**Sample output**

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.34.35@2x.png" alt=""><figcaption></figcaption>

The output includes clickable links that open the relevant documentation pages listed in the 'More Information' section.
