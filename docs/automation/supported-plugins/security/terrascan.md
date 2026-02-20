# Terrascan

This plugin allows you to scan the Terraform code with `Terrascan` and provide output.

`Terrascan` is a static code analyzer for Infrastructure as Code.

It provides 500+ out-of-the-box policies so that you can scan IaC against common policy standards such as the CIS Benchmark.

* [Home page](https://runterrascan.io/)
* [Source code on Github](https://github.com/tenable/terrascan)

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.48.40@2x.png" alt=""><figcaption></figcaption>

**Configuration options**

1. Name: This is Brainboard field to describe what this task is about.
2. Version: always points to the latest version.
3. Extra environment variables: variables that you can define here that will be used as environment variables in the execution shell.
4. Scan rules: specify rules to scan, example: –scan-rules=“ruleID1,ruleID2”.
5. Skip rules: specify one or more rules to skip while scanning:
   1. Example: –skip-rules=“ruleID1,ruleID2”
   2. No space is added after the comma in the list
6. Ignore failure: this will put the task in a non-blocking failure, which means, the execution of the following stage will be triggered even if the task fails.
7. Require approval: means that this task will not be executed until approved by people added in the approvers' list.
   * The task remains blocked until all approvers added in the list approve it.
   *   When enabled, it allows you to add approvers to the list<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.25.53@2x (1).png" alt=""><figcaption></figcaption>
   * The approver has to be Brainboard user
8. Show passed: display passed rules, along with violations.

**Sample output**

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.55.26@2x.png" alt=""><figcaption></figcaption>
