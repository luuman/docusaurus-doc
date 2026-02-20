---
icon: binary-lock
sidebar_class_name: sidebar-item-icon icon-binary-lock
---

# Data managed by Brainboard

### Overview

Brainboard helps you build and manage cloud infrastructures, which means there are areas where either information are manipulated and/or stored.

1. Data manipulated: Brainboard will use this information to do some actions but doesn't store it.
2. Data stored: means that Brainboard keeps this information for future execution.

It also depends on the offering you have the information manipulated and stored are not the same.

Please refer to the [pricing page](https://www.brainboard.co/pricing) if you want to understand all the possibilities you have to use Brainboard.

:::note
With the self-hosted version, all your information are stored within your infrastructure. Brainboard has no access to it
:::



### Type of data

Here are the types of data used by Brainboard:

1. Cloud architectures: are the design of your cloud infrastructure.
2. Cloud resources: all the resources that you use from you preferred cloud provider(s) and their configurations.
3. [Variables](../input-output/variables.md).
4. Secrets: you can choose to store the secrets in your preferred vault solution like AWS KMS, Azure key-vault or HashiCorp Vault and only refer to it through data sources or variables.
   * If you deploy through Brainboard, these secrets will be shared with the runner that will provision the infrastructure.
5. [Terraform state file](https://developer.hashicorp.com/terraform/language/state).
6. [Git information](../settings/integrations/git-configuration/): contains either your GitHub connection or personal git tokens. It may also include the names of your repository and files.
7. [Cloud providers credentials](../data/cloud-providers/): these credentials allow you to provision or destroy the infrastructure.
8. Users personal information: We only store the following information about our users:
   * First name
   * Last name
   * Email address
   * Organization name
9. Pipeline information: it contains information about the provisioning of your infrastructure and the deployment workflow you have.

:::note
The auto-generated Terraform code is not store as a Terraform code. This is one of our solid security strategies. In fact, the code is automatically generated every time you need it.
:::

### Encryption

All information stored in Brainboard are encrypted at rest and at transit.

### Data access scenarios

There are 3 scenarios where data is accessed by Brainboard:

#### 1. Design in Brainboard and push to git

In this scenario:

* You design your cloud infrastructure in Brainboard
* Generate the Terraform code in Brainboard
* Then, you push the generated code into your preferred git repository

1. Data manipulated by Brainboard:
   * Architecture diagram.
   * Cloud resources and their configuration.
   * Variables.
   * Credentials to access git repo, unless you want to manually download the code and push it from your laptop.
2. Data stored by Brainboard:
   * Architecture diagram as a `JSON` structure. Not as a diagram.
   * Cloud resources and their configuration.
   * Variables.
   * Credentials to access git repo.

#### 2. Plan in Brainboard and push to git

In this scenario:

* You design your cloud infrastructure in Brainboard
* Generate the Terraform code in Brainboard
* Do a Terraform plan or trigger the pipeline for the plan in Brainboard
* Once your architecture is validated, you push the generated code into your preferred git repository

1. Data manipulated by Brainboard:
   * Architecture diagram.
   * Cloud resources and their configuration.
   * Variables.
   * Terraform state file.
     * If you use a remote backend, Brainboard needs to access it to run some Terraform actions like plan, apply or destroy.
   * Credentials to access git repo, unless you want to manually download the code and push it from your laptop.
   * Cloud provider(s) credentials with at least `read-only` privilege.
2. Data stored by Brainboard:
   * Architecture diagram as a `JSON` structure. Not as a diagram.
   * Cloud resources and their configuration.
   * Variables.
   * Credentials to access git repo.
   * Cloud provider(s) credentials with at least `read-only` privilege.

#### 3. Design & deploy in Brainboard

In this scenario:

* You design your cloud infrastructure in Brainboard
* Generate the Terraform code in Brainboard
* You may want to push the generated code into your preferred git repository
* Deploy with Brainboard, either with `apply` or using our CI/CD engine to trigger your pipelines

1. Data manipulated by Brainboard:
   * Architecture diagram.
   * Cloud resources and their configuration.
   * Variables.
   * Terraform state file.
   * Cloud provider(s) credentials with `read-write` privilege.
   * Credentials to access git repo, unless you want to manually download the code and push it from your laptop.
2. Data stored by Brainboard:
   * Architecture diagram as a `JSON` structure. Not as a diagram.
   * Cloud resources and their configuration.
   * Variables.
   * Cloud provider(s) credentials with `read-write` privilege.
   * Credentials to access git repo.

### Data flow diagram

<img src="../.gitbook/assets/Brainboard HLD.png" alt=""><figcaption></figcaption>

### Contact us

Reach out to our security team if you have any question related to the security of your data at `security@brainboard.co`.
