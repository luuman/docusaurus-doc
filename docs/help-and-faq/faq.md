---
icon: message-question
cover: >-
  https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?crop=entropy&cs=srgb&fm=jpg&ixid=M3wxOTcwMjR8MHwxfHNlYXJjaHw4fHxjbG91ZCUyMHRlY2hub2xvZ3l8ZW58MHx8fHwxNzY4OTMwNjU1fDA&ixlib=rb-4.1.0&q=85
coverY: 0
coverHeight: 218
sidebar_class_name: sidebar-item-icon icon-message-question
---

# FAQs

### 1. Do I need to be a Terraform expert to use Brainboard?

No. You don't need to be a Terraform or IaC expert to use Brainboard. However, a minimum knowledge of Terraform is required to fully leverage Brainboard.

:::note
Brainboard simplifies the complexity of Terraform and helps you configure cloud resources with a configuration menu. It will then write clean Terraform code for you, according to best practices.
:::

▶️ We also help the community by providing free Terraform training, which you can find on our [Youtube channel](https://www.youtube.com/channel/UCB0DLhFEgta83U62mQzxGPg).

***

### 2. What is the difference between Brainboard and vanilla Terraform?


{% column width="41.66666666666667%" %}
**Terraform** is a powerful IaC tool that deploys the code you write.


{% column width="58.33333333333333%" %}
**Brainboard,** on the other hand, is an end-to-end cloud management solution built on top of Terraform, featuring a visual architecture designer that automatically generates Terraform code. It also has a secure CI/CD engine, native Git integrations and more features to help you standardize and centralize your cloud.



***

### 3. Which Git providers does Brainboard support?

The following git providers are supported:

* GitHub
* GitLab
* Azure DevOps
* Bitbucket

:::note
Request your Git provider. If your Git repository is not listed here, you can request it in our [public roadmap](https://roadmap.brainboard.co).
:::

***

### 4. How does Brainboard integrate with my current workflows?

In Brainboard, you can include all your current workflows:

* Manage all your Terraform States.
* Set up the Git integration in Brainboard to be able to do pull requests and import existing code.
* Create replicable templates for you and your team to use.
* Import your Terraform modules from a registry, locally or git.

***

### 5. Can I migrate my existing infrastructure to Brainboard?

:::tip
You have the possibility to import your existing infrastructure and auto-generate the diagram.
:::

We support importing any file that contains a valid Terraform code.

There are **two** ways to do it:

1. Provide the URL of the Git repo (GitHub, GitLab, Bitbucket,...)
2. Upload one or multiple files

***

### 6. Is there a hosted version of Brainboard?

✅ Yes, we provide a self-hosted version based on eligibility criteria.

If you are interested in the hosted version, [contact us](https://www.brainboard.co/resources/contact-sales).

***

### 7. Which cloud providers are supported by Brainboard?

The following providers are supported:

* Azure
* AWS
* OCI
* GCP
* Scaleway.

:::note
You can request (or vote for) your cloud provider to be added to our [public roadmap](https://roadmap.brainboard.co/boards/feature-requests).
:::

***

### 8. How often do you update cloud providers?

* The update process is **automatic.** As soon as a new version is released, we automatically trigger the update process that will do extensive tests.
* Tests usually take up to **48h** to complete, and if they are successful, we release the new version automatically.

***

### 9. Can I deploy my architecture with Brainboard?

Brainboard has an innovative CI/CD engine dedicated to the infrastructure, where you can **execute all Terraform actions** _<mark style="color:purple;">(Terraform plan, Terraform apply, Terraform destroy)</mark>_ within a secure sandbox and get the output in real time or build your deployment workflow and trigger it.

***

### 10. How can I collaborate with my colleagues?

There are **two** aspects in terms of collaboration:

1. **Build:** Brainboard supports real-time editing of the same architecture by multiple users. All you need to do is invite your colleagues and give them the right access.
2. **Deploy:** When you build your CI/CD pipeline within Brainboard, you have the possibility to request approvals from any team/person, which allows you to orchestrate the execution by involving all stakeholders.

***

### 11. How does Brainboard integrate tools like Infracost, Checkov, Tfsec, ServiceNow, etc?

Brainboard allows you to **build your pipelines** with its innovative and powerful CI/CD engine, where you can just pick the tools you are used to using and configure them easily.

Brainboard **maintains** these tools for you, so you don't worry about upgrading them automatically or troubleshooting when things go wrong.

🔗 Refer to the [supported plugins](../automation/supported-plugins/) page for more details.

***

### 12. Can I create templates for my cloud infrastructures?

**Yes.** You can create a template from any architecture you have. By doing so, you build your internal catalog of templates that anyone within your organization can use off the shelf without reinventing the wheel.

***

### 13. Is Brainboard free?

Yes, there is a free version of Brainboard.

:::note
When you sign up, you have a 21-day free trial that provides you with access to all features of Brainboard. After that, if you don't upgrade, your account is automatically switched to the free plan.
:::

***

### 14. How do I generate the Terraform code for my cloud architecture?

The Terraform code is **automatically** generated for your cloud architecture as you design.

***

### 15. Is SSO supported?

Yes, in the <mark style="color:purple;">**enterprise**</mark> version. We support both **SAML** and **OIDC.**

***

### 16. How can I request a demo for Brainboard?

Please reach out to our sales team at `sales@brainboard.co`.
