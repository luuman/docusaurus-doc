# Welcome

### What is about?

{% embed url="<https://www.youtube.com/watch?v=A37Z1YgXYUI>" %}

Brainboard is a solution that helps you:

* Build your cloud infrastructure design with Terraform/OpenTofu resources.
  * Automatically generate the Terraform code.
* Centralize your cloud infrastructure and have a unique source of truth.
* Standardize your IaC process.
* Lower the learning curve for Terraform and the cloud.
* Easily onboard new engineers and safely offboard those leaving.
* Create a self-serve model within your organization, where your reference architectures are easily consumed by your teams.

It is a collaborative and innovative solution that natively integrates IaC best practices, enforces security and has an embedded CI/CD engine out of the box.

### Why?

Brainboard has been built by experienced engineers with more than 20 years of experience, for engineers, by using automation and AI to make building and managing cloud infrastructure easier, without reinventing the wheel.

Here are the reasons why Brainboard is the good fit for you:

* It helps you centralize all the management of the cloud infrastructure, literally from end to end, into one single & unique platform.
* Move fast securely: It is designed to be intuitive and easy to learn, while providing full power of an embedded CI/CD to shift left fast.
* No one is left behind: Anyone can understand a design, and for those who want to go deeper, the Terraform code is next to the design.
* Lower the learning curve of the cloud and Terraform/IaC.
* Help organizations capture the maturity of their cloud journey in a system, that scales as the processes and use cases grow.
* Document faithfully the state of your cloud infrastructure that is already provisioned. This documentation is in a constant sync with the reality.
* Structure the review and approval process of the cloud infrastructure.
* Encourage adoption of best practices as they are implemented natively.
* Having a system that easily integrates with enterprise workload.
* Be able to predict cloud infrastructure deployment in terms of costs and configuration.

### Brainboard & Terraform

Among the plethora of tools in the infrastructure as code (laC) ecosystem, Terraform is the most used language in the space, where you only describe how you want your infrastructure to be. Then Terraform will provision/update your infrastructure to match the desired state.

Engineers use vanilla Terraform to build their infrastructures, this is a manual process to write every line of code, test it, lint it, document it, and once approved, deploy it.

When they need to replicate the same stack, they either copy/paste and manually change variables or use scripts to help them do that.

Brainboard, on the other hand, removes the hassle of doing everything manually, saves time and reduces error by leveraging automation and AI.

It uses Terraform as an execution layer, and offers engineers a solution to build and manage production-grade cloud infrastructures without manually writing every line of the code and gluing different tools together to deploy it.

### How Brainboard works

Brainboard is composed of different services that work together, in harmony, as one application.

There are 2 main categories of services:

1. **Synchronous services**: that process the information of users, and return the value in real time.

   For example, generating the Terraform code as the user designs the infrastructure.
2. **Asynchronous actions**: users request actions to be done, and once completed, Brainboard informs them.

   For example, triggering an import from a cloud provider. Brainboard connects to the target cloud provider, lists the resources, then builds the design, the Terraform code and the Terraform state file. Once the import is done, the user is informed via email.

### Get in touch

We want to hear your feedback, listen to your feature requests, and answer your questions. Here is how you can reach out to us:

* In app: Click on the `Help` button in the top-right and select `Ask us anything`.
* By email: <contact@brainboard.co>
* Follow our YouTube channel [here](https://www.youtube.com/channel/UCB0DLhFEgta83U62mQzxGPg)
* Product roadmap [here](https://roadmap.brainboard.co/roadmap)

### What's next

Sign up [here](http://app.brainboard.co/register) to explore the platform, or reach out to our cloud architects team, who will be happy to help you get started and help you build your first use cases.
