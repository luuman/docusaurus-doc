---
icon: sparkles
sidebar_class_name: sidebar-item-icon icon-sparkles
---

# Brainboard philosophy

Brainboard has been built by engineers for engineers, and we started it as we were scratching our own itches.

What was an eye-opening to us at the beginning is to realize that most engineers go through the exact same steps to create a cloud infrastructure:

* They start with a high level design (HLD) on a whiteboard or a paper or even in the head of the engineer
  * Even if you are building the infrastructure without design, you have it in your mind. For example: This database will be in this security group, connected to this application, with this data flow, behind this load balancer....
  * If the team doesn't have a design, no one can review the architecture and this usually leads to communication barriers.
* When the design is done, they will translate it into code. Whether the code is written by the same team or a different one doesn't make any difference, the workflow stays the same.
* This Terraform code will, first, be checked if it's valid (terraform plan or validate), then scanned for security, policies, naming conventions, costs...:
  * This is what is called [shift left](../../help-and-faq/glossary.md#shift-left) in the industry, where the feedback loop has to be short. You detect errors as early as possible, fix them and iterate until you are ready to deploy... Actually, not yet, as most of the time, you need to change the design a bit to make it match the Terraform implementation.
* Once the design and code are validated, the deployment process starts either automatically or manually, with or without approval.
  * If it's automatic, it will be done through the CI/CD.
* Then, comes all the heavy things like managing secrets, collaboration with different people in the same team, cross teams, deploy multiple environments and the most painful of all is the drift.
  * It needs discipline to respect the process for every single change you have to do and since it relies on humans, some of them just fall into the old habit, going straight to the console of the cloud provider and change things manually.
* At this point, let's assume that all the steps are aligned, and you provision the infrastructure successfully, then every change you want to introduce has to go through the same steps again and again. It's not a negative statement by the way, it's just how the process should work.

<mark style="background-color:purple;">We wanted this to change!</mark> We wanted it so badly that we said to ourselves, let's write a wish list: what we want in an ideal world? We started writing down:

* First, we wanted to rely on automation and don't want to repeat ourselves, in a way that when we design, the code is auto-magically generated. Let's focus on Terraform, it's the most used one...OK!
* But we wanted to still have control over the code and being able to do what we are used to do in Terraform: variables, outputs, loops, data blocks, modules...and able to manage multiple environments easily. No more manual tasks please.
* And wanted to have the shortest feedback loop possible, so why not an embedded CI/CD with all the tools we use: tfsec, checkov, terrascan, OPA, infracost...
  * Oh, security should be a native part. No more running after engineers to comply and rely on discipline.
* We also wanted to push the boundaries, because <mark style="background-color:purple;">it's not about the tool itself but the workflow</mark>, and wondered why not having a reference architectures catalog available to anyone within the team and we finally stop reinventing the wheel. Sounds amazing, right?
* Finally, we dreamed about making it enterprise ready with RBACs, private runners, live collaboration, SSO, private registries and the list didn't stop. At that exact moment, we just said: <mark style="background-color:purple;">LET'S BUILD IT</mark><mark style="background-color:purple;">**.**</mark>

Fast-forward, few years later... Brainboard becomes the one platform of choice for end-to-end cloud infrastructure management that <mark style="background-color:purple;">offers exactly the wish list we dreamed about</mark>. Delivered and supported by the most talented engineers in the cloud, IaC and software engineering.



