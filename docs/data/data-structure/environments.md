# Environment

### Description

An `environment` is a logical grouping of cloud architectures that are supposed to have the same criticality or serve the same purpose. Like dev, staging, QA, prod…

Environments can be used to separate and `isolate` development, staging, and production resources, or to create dedicated environments for different teams or applications.

:::note
Brainboard environments provide a flexible and powerful way to manage your cloud infrastructure. It is like a folder, you can put any logic that reflects your processes.
:::

### Create a new environment

*   To create a new environment, click on the name of the architecture in the top-left corner to open the projects' page, and click on the `+` as below :&#x20;

    <img src="../../.gitbook/assets/CleanShot 2024-10-25 at 16.51.51.png" alt=""><figcaption></figcaption>

### Update environment

To update an existing environment, first click on the name of the environment, it will select it and display the following information on the right that you can customize:

<img src="../../.gitbook/assets/CleanShot 2024-10-25 at 16.57.23.png" alt=""><figcaption></figcaption>

1. Environment name.
2. Description: Multiline description of your environment.
3. Tags: You can add multiple tags. These tags are searchable.
4. Read-only information:
   1. Updated at: When the last time the environment has been updated. UTC timezone.
   2. Created at: When the projected has been created. UTC timezone.
   3. Updated by: Who is the last person who updated the environment.
   4. Created by: Who created the environment.
5. ID: This is the environment UUID. You need it when you communicate with our support.

### Delete environment

To delete an environment, click on it to select it, then click on delete button:

<img src="../../.gitbook/assets/CleanShot 2024-10-25 at 17.05.03.png" alt=""><figcaption></figcaption>

:::danger
Deleting an environment will delete all architectures inside it. This action cannot be undone.&#x20;
:::

### Synchronize architectures across environments

Refer to the [Architecture Synchronization](cloud-architecture/synced-architectures.md) to know more about it.

By following these steps, you can effectively manage multiple environments in Brainboard and ensure that your infrastructure is consistent and reliable across all stages. This is the best way to eliminate the drift between different environments.
