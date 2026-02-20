---
icon: binary-circle-check
sidebar_class_name: sidebar-item-icon icon-binary-circle-check
---

# Disaster recovery

### Definition

**Disaster Recovery (DR)** is a structured, and documented approach that gives organizations the ability to recover and protect their IT infrastructure, data, and operations after a disruptive event, such as natural disasters, cyberattacks, hardware failures, or human errors. It is a critical component of business continuity planning (BCP) and focuses on restoring normal business operations with minimal downtime and data loss.

### DR components

Modern applications and infrastructures require a different DR approach, and part of the planing for a DR strategy in the cloud, is to understand what will be saved and how. This will determine how it will be restored in case of a disaster. There are  2 different components:

1.  **Data:** These are the information / data inside the resources. For example, the records inside the database or files inside the storage.

    * This part could be handled either by the native cloud services, simple replication, or dedication solutions to specific workloads.
    * All providers offer backup solutions. For example: Azure backup policy, vault, AWS backup plan...

    Testing the recovery means restoring the data and checking its integrity.
2.  **Resources:** This represents the real cloud resources to provision before restoring the data.

    * It is a hard requirement before restoring the data.
    * If you have more resources connected to each other and configured to work with each other, you need to save the complete architecture as a data.

    Restoring this workload requires provisioning cloud resources with exactly the same configuration as the original one.

This means, that before restoring the data in the cloud, you need to first create the resources exactly as it were before. For example: If you have an application that has servers and a database, in order to resume operation before the disaster, you need to, first, create the servers and the database with the same configuration. Then restore the records and files as they were before.

Brainboard is designed to help you:

* Backup and restore your complete architecture: This allows you to restore your resources with their configuration as they are/were in production.
* Build your data backup architectures: Whether you are using native cloud services for backup or external solutions, you can build it as an architecture in Brainboard to be able to backup your data on a regular basis.

:::note
Accesses, authorizations, link between resources are saved and restored as either cloud architectures, resources or data objects.
:::

#### Stateless vs Stateful workloads

It is important to understand the nature of your workloads to build the most effective DR strategy for them:

1. **Stateless workloads:** There is no data to be saved or restored, only provisioning of the resources.
2. **Stateful workloads:** Like databases, that requires the data to be saved and restored later when needed.

This is mainly used to understand how operations will resume, and help understand the order & dependency between resources, if any.

### Disaster recovery steps in Brainboard

Disaster recovery is not just about reacting to incidents, but also proactively preparing for them to safeguard the organization's long-term viability.

Here are the complete steps to build a robust and reliable DR strategy in Brainboard including a continuous checking to make sure the DR environment is always in a deployable state.

1. **Determine the source of the information:** In this step, you determine where is the environment for which you are creating a DR strategy. Brainboard helps either:
   1.  **Import from cloud providers:** For workloads that don't have any Terraform / IaC code, Brainboard allows you to import them, generate a design with Terraform code and ultimately build a DR environment for them.

       Refer to the page [migration](../help-and-faq/enterprise-customers/migration/ "mention") to understand how to migrate your cloud environment to Brainboard and generate Terraform code for it.
   2. **Import from existing Terraform:** If you already have a Terraform code for your environment, you can easily import it in Brainboard to get started. You can import your Terraform code from either a Git repository or local files.
2.  **Make the configuration dynamic:** Once you import your cloud infrastructure, the next step is to make the information that are specific to the DR environment dynamic in Brainboard. This allows you to create a replicas of your production without impacting it.

    You do this by creating variables in the imported architecture and replace the hardcoded values with them:

    1.  Create a variable: Click on the `Variable` button in the leftbar to open the variables' page

        <img src="../.gitbook/assets/CleanShot 2024-12-02 at 13.51.22.png" alt=""><figcaption></figcaption>
    2.  Create a new variable, give it a name, a description, type and add a value in the value field.

        <img src="../.gitbook/assets/CleanShot 2024-12-02 at 13.51.52.png" alt=""><figcaption></figcaption>
    3.  Use the variable in the architecture, the generated code should reflect your changes.

        <img src="../.gitbook/assets/CleanShot 2024-12-02 at 13.52.27 (1).png" alt=""><figcaption></figcaption>

:::warning
When you create a variable, use "value" field, not the "default value" because the default value will be shared with all environments.
:::

#### Common customizations:

Here are some of the most common and important information that you may need to change into a dynamic configuration:

1.  **Naming conventions:** It is a best practice to have naming conventions for your resources, so you can clearly identify production ones from non-prod or DR. You can do it in Brainboard by creating variables that are part of your convention and use them.

    <img src="../.gitbook/assets/CleanShot 2024-12-02 at 14.07.39.png" alt=""><figcaption></figcaption>
2. **Tagging:** It's also a best practice to have different tags for different purpose. For e.g. you can have the environment as a tag that will be injected in your resource to know which ones are part of the prod and which others are part of the DR environment.
3.  **Location:** If the DR environment has to be created in a different location/region, it's better to create a location or region variable and use the right Brainboard container to help you inject it in all resources:

    <img src="../.gitbook/assets/CleanShot 2024-12-02 at 14.05.28.png" alt=""><figcaption></figcaption>

    With this configuration, you only have to specify the value of the location of every environment.
4. **Create and synchronize the DR environment:** Now that you have configured the variables and updated your configuration, you click on the name of the architecture in the top left corner and create a synchronize copy of it in the DR environment.
   1.  Click on clone architecture button

       <img src="../.gitbook/assets/CleanShot 2024-12-02 at 13.52.55.png" alt=""><figcaption></figcaption>
   2. Specify the Disaster recovery as the target environment. If you don't have a disaster recovery folder, create one first.
   3.  Very important: Click on "Sync" switch. This will create a copy of your original architecture (in this case production) and keeps it synchronized with your production. Whenever you change the production environment, Brainboard automatically replicates the changes in the DR environment.

       <img src="../.gitbook/assets/CleanShot 2024-12-02 at 13.53.12.png" alt=""><figcaption></figcaption>
   4.  Verify that the sync is active: You should have a red button in the options' bar to indicate the sync is in effect:

       <img src="../.gitbook/assets/CleanShot 2024-12-02 at 14.18.31.png" alt=""><figcaption></figcaption>

       1.  When you click on it, it will show you all the synchronized environments (synced architectures):

           <img src="../.gitbook/assets/CleanShot 2024-12-02 at 14.19.06.png" alt=""><figcaption></figcaption>

:::note
**How the sync works:** Once you create a synced architecture, every modification you do in one environment will be automatically replecated into the other environment(s), except the values of the variables that are specific to every environment.

This replication doesn't trigger deployment to give you the flexibility to chose which environment you want to deploy, how and when.

Please refer to page [synced-architectures.md](data-structure/cloud-architecture/synced-architectures.md "mention") for more details about this feature.
:::

4. **Continuous monitoring & notification:** Now that you configured your DR environment through the synced architecture of your production, you can schedule a CI/CD workflow in Brainboard. This will test if the infrastructure of the DR environment is always in a deployable state and notify you if there are any errors.
   1.  Click on the CI/CD button in the topbar, it will open the CI/CD designer where you can create a new workflow

       <img src="../.gitbook/assets/CleanShot 2024-12-02 at 14.30.02.png" alt=""><figcaption></figcaption>
   2. Schedule the workflow to run on a regular basis:
      1. Click on the wheel button next to the name of the workflow to open its configuration.
      2. Enable the schedule by turning the switch on: Use crontab syntax for that. For example, if you want it to run every Monday at 6AM UTC time you put: `0 6 * * 1`
      3.  Activate the notification to receive an email when the execution fails.

          <img src="../.gitbook/assets/CleanShot 2024-12-02 at 14.33.11.png" alt=""><figcaption></figcaption>
      4.  Add Terraform task and chose between, `plan`  or `apply`. If you select \`apply\`, see the section below.

          <img src="../.gitbook/assets/CleanShot 2024-12-02 at 14.34.37.png" alt=""><figcaption></figcaption>
5.  **Full Deployability Test (FDT):** Brainboard allow you to automatically run a full deployability test, which means you can create a schedule to automatically deploy the DR environment completely and destroy it right after. This ensures that the DR environment is always in a deployable state.

    Here are the steps:

    1. Create a scheduled CI/CD workflow as described above. Don't forget to enable notifications in case any issue happens when the infrastructure is created or deleted.
    2.  Add 2 Terraform tasks: one for `apply` and one for `destroy`.

        <img src="../.gitbook/assets/CleanShot 2024-12-02 at 16.30.12.png" alt=""><figcaption></figcaption>

        Once the workflow is triggered as specified in the schedule, it will create the infrastructure in the DR environment and if the deployment is successful, it will destroy it right after.

        If the deployment fails, you receive a notification.

:::note
If you are planning to configure a Full Deployability Test, first, do an apply and check it that it is working properly before activating the schedule and automation.
:::

