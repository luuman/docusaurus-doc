---
icon: spell-check
sidebar_class_name: sidebar-item-icon icon-spell-check
---

# Glossary

Here are the definitions for Brainboard terms.

### Account

An `account` in Brainboard refers to a user's profile that stores their personal information, role, and access to various features or services supported by Brainboard.

Refer to the [Account Management](../settings/account.md) to know more about it.

### Apply

The `apply` action in Brainboard is a command used to create or modify the resources defined in the Terraform configuration. The "terraform apply" command is used to provision the infrastructure described in the Terraform configuration and to bring the infrastructure into the desired state.

### Architecture

The `architecture` refers to the design and visual representation of infrastructure, including the resources, relationships, and interactions of these resources. It typically involves the use of visual representations to model and describe the structure, components, and behavior of a system and the terraform configuration generated from the diagram.

### CI/CD designer

The CI/CD designer in Brainboard is a visual tool responsible for designing processes that automate the integration and deployment of cloud architectures. With the CI/CD designer, the pipelines are created in a visual way without any YAML knowledge.

### CI/CD engine

The CI/CD engine is the core component of the CI/CD pipeline that automates the integration and deployment of the built architectures. The engine is responsible for triggering builds, running tests, and deploying code changes to various environments. It integrates with open-source plugins and deployment tools to provide a seamless and automated process for delivering infrastructures.

### Cloud credentials

Cloud credentials are login credentials (username and password, or keys) that are used to access and manage cloud-based services and resources. They enable users to connect to cloud platforms through terraform, create and manage resources, and access data stored in the cloud.

### Cloud provider

A Terraform cloud provider is a plugin for Terraform that allows Terraform to provision and manage cloud-based resources. The Terraform cloud provider acts as an interface between Terraform and the underlying cloud platform, allowing Terraform to provision, configure, and manage cloud resources in a consistent and repeatable manner.

### Data source

In Brainboard, `data source` refers to information that can be used as input to Terraform configurations. Data can come from many different sources, including external APIs, existing infrastructure, configuration files, or other data sources. In Terraform, data is used to provide information that can be used to manage and manipulate resources and can be retrieved using the `data` block.

### Design area

The design area refers to the main area in Brainboard where a user can build their architecture visually. It refers to the main canvas or workspace where you create and edit your architectures. It is the area where you can add and arrange resources, connectors, and other elements to represent your ideas and designs.

### Destroy

The `destroy` action in Terraform is a command used to destroy the resources that have been created by Terraform. The `terraform destroy` command is used to remove the resources that have been previously provisioned, along with any related resources, such as network interfaces, storage volumes, or databases. The "destroy" action can be used to undo the changes that have been made by Terraform, effectively removing the resources and returning the infrastructure to its original state.

### Environment

The use of `environments` enables teams to manage multiple versions of the same infrastructure in parallel, making it easier to test and deploy changes. Environments are used to separate resources that belong to different stages of a development or deployment pipeline, such as dev, staging, and production. This allows teams to manage multiple versions of the same infrastructure in parallel, with different settings, configurations, and resources for each environment.

### Resource Configuration

The Resource Configuration panel in Brainboard contains all the information and details about objects in the diagram. It is displayed as a side panel when a resource is selected on the diagram or in the Resources List. The Resource Configuration panel contains information about resources/data, such as their name, properties, attributes, and provides form-based editing, code view, and state inspection.

### Inventory view

An inventory view refers to a representation of all the projects/environments/architectures in Brainboard.

The `Inventory view` is a tool that helps users view and navigate the structure of their project in an organized manner, making it easier to find and access the components they need to work on. It can also be used to categorize, organize, and search for architectures within an organization.

### Member

A member user is an individual who has joined an organization and has been granted access to specific resources, privileges, and responsibilities within that organization.

The concept of member users helps to provide structure and organization within an organization and to ensure that users have the appropriate level of access and permissions based on their role within the organization.

### One action

In Brainboard, `one action` is referred to a single terraform action. One action is a way to execute quickly one Terraform action at a time without triggering the pipeline.

Terraform actions are the operations that Terraform performs to manage infrastructure. These actions are triggered by Terraform commands such as `validate`, `plan`, `apply`, or `destroy` and determine the desired state of the infrastructure based on the Terraform configuration files.

### Output

Outputs are values that can be exported from a Terraform module and used in other Terraform modules or configurations. Outputs allow users to share values between Terraform modules, making it easier to reuse and manage Terraform configurations.

### Personal git token

A personal Git token is an authentication token that is used to access Git repositories. Personal Git tokens are used to grant access to Git repositories without sharing the user's password. Personal git tokens allow every user to add one or more git credentials in Brainboard to be able to do pull requests.

Personal Git tokens are typically used for Git hosting services, such as GitHub, GitLab, and Bitbucket, where users can generate personal Git tokens for accessing their repositories.

### Pipelines

A pipeline is a set of automated processes that manage the deployment and management of infrastructure. In Brainboard pipelines represent the history of the execution of your workflow.

Pipelines help organizations to implement a continuous delivery approach to infrastructure deployment and management.

### Plan

The Terraform plan is generated using the terraform `plan` command, which compares the current state of the infrastructure to the desired state defined in the Terraform configuration files. The Terraform plan outputs the changes that will be made to the infrastructure, including the addition, modification, or deletion of resources.

### Project

A `project` refers to a collection of diagrams, typically related to a specific subject, that are created and managed within Brainboard.

Each project is composed of one or more environments and architectures. In addition to creating and managing diagrams, Brainboard also offers a range of collaboration and sharing features, allowing users to work together on projects.

### Pull request

The pull request process provides a way for multiple users to collaborate on changes to the architectures, as well as a way for managers to review and approve changes before they are merged into the main codebase. A pull request is a functionality that allows you to push the generated Terraform code from Brainboard into your git repository.

The pull request is then reviewed by one or more reviewers, who can provide feedback on the changes and suggest additional changes.

### Remote backend

A `remote backend` is a backend for storing Terraform state that is located on a remote data store. It allows multiple users or systems to collaborate on the same Terraform configuration and enables secure, centralized storage of Terraform state. When Terraform runs, it retrieves the state from the remote backend, uses it to determine the desired state of the infrastructure, and then updates the state in the remote backend after making changes. Examples of remote backends include AWS S3, Google Cloud Storage, or Terraform Enterprise.

### Resource

A `resource` is a unit of infrastructure such as a virtual machine, network, storage account, or database that Terraform provisions and manages. Resources are defined in Terraform configuration files using resource blocks, which specify the type of resource, its name, and its configuration parameters. Terraform uses the resource blocks to determine the desired state of the infrastructure and make any necessary changes to bring the resources into that state.

### Shift left

In Infrastructure-as-Code, shift left means detecting errors as early as possible in the development phase (before going to production) and fixing them.

### Synced architectures

`Synced architectures` refers to multiple architectural components or systems that are kept in a consistent or synchronized state. This can involve ensuring that data, configurations, and other elements are updated and aligned across different components or systems so that they remain consistent and up-to-date.

### Team

A team refers to a group of individuals who work together to develop, design, test, and maintain infrastructures.

The role of a team is to collaborate and communicate effectively to produce high-quality architectures that meet the needs of customers. Teams may use various methodologies, such as Agile, Scrum, or Waterfall, to manage their projects, and they may use a range of tools and technologies to support their work, including version control systems, integrated development environments, project management tools, and more.

### Terraform module

A `Terraform module` is a container for multiple Terraform configurations that are used together. Modules are used to organize Terraform code and to promote code reuse. A module can include Terraform resources, variables, outputs, and other modules.

Modules can be thought of as a way to encapsulate Terraform configurations and make them more reusable, composable, and shareable. Modules can be used to encapsulate common patterns and provide a way to abstract complex infrastructure into simpler, reusable components.

### Variable

A variable is a named value that can be used in Terraform configurations. Variables serve as inputs for Terraform modules, allowing users to provide values that can be reused across multiple resources, configurations, and modules. Variables provide a way to make Terraform configurations more flexible and configurable.

### Version

An architecture version refers to a specific iteration or revision of an architecture. Architecture versions are used to track changes to the architecture over time, and to provide a historical record of the evolution of a system. Brainboard provides a native versioning mechanism that allows you to keep track of every modification you do in your architecture. It also allows you to roll back or go to any specific point-in-time snapshot.
