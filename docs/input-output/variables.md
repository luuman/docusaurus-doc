---
icon: square-root-variable
sidebar_class_name: sidebar-item-icon icon-square-root-variable
---

# Variables ⒳

### Definition

In Terraform, a variable is a way to store and reuse values throughout your Terraform code. Variables are defined using the `variable` block and can be used to parameterize your Terraform code, making it more flexible and reusable.

### Types

There are `three types` of variables in terraform that we can consider as input variables:

#### Local Variables

Local variables are a group of key-value pairs that can be used in the configuration. The values can be hard-coded or be a reference to another variable or resource. Local variables are accessible within the module/configuration where they are declared.

:::note
Use local variables in combination with input variables: Use local variables with input variables. This allows you to use local values as input for other resources or modules, making your Terraform code more dynamic and reusable.
:::

#### Input Variables

The purpose of input variables is to provide a way to parameterize a Terraform configuration. Input variables allow you to define values that can be passed into a Terraform configuration at runtime, rather than hard-coding them within the configuration itself. This makes your Terraform code more reusable and flexible, as it can be used in different environments or for different use cases with different input values.

#### Environment Variables

Environment variables can be used to configure various aspects of Terraform's behavior, such as the location of the state file or the API endpoint of the provider. Additionally, Terraform environment variables can be used to provide sensitive information, such as API keys or credentials, without storing them in plain text in the configuration files.

Here are a few examples of how Terraform environment variables can be used:

### Attributes

Here are attributes that you can set when creating a variable:

* **name**: the name of the variable
* **scope**: the level within which the variable will be used. Possible values are:
  * Organization
  * Architecture
  * Project
  * Environment
  * Local
* **type**: to identify the type of the variable being declared.
* **value**: the actual value of the variable. When you add this value, it will be put in the file `terraform.tfvars` to stay compliant with Terraform best practices.
* **default**: default value in case the value is not provided explicitly.
* **description**: describes the purpose of the variable.
* **validation**: rules to validate the input of the variable.
* **sensitive**: a boolean value. If true, Brainboard and Terraform will hide the variable’s value anywhere it is displayed.

Input variables support multiple data types. They are broadly categorized as simple and complex. `string`, `number`, `bool` are simple data types, whereas `list`, `map`, `tuple`, `object`, and set are complex data types.

### Create variables

To create a new variable:

1.  Go to the input menu in the left bar

    ![add\_input\_variable](../.gitbook/assets/add\_input\_variable.png)
2.  Click on the + button next to the scope that you need to add the variable. It can be Organization, Project, Environment, Architecture and Locals

    ![add\_variable](../.gitbook/assets/add\_variable.png)
3.  Add the needed information in the variable form

    ![Variable attributes](../.gitbook/assets/variables\_attributes.png)
4. Click on the add button

### Edit variables

To edit a variable, follow the steps below:

![modify\_variables](../.gitbook/assets/modify\_variables.png)

### Delete variables

To delete a variable, just select the variable and click on the bin icon as below:

![delete\_variable](../.gitbook/assets/delete\_variable.png)

### Variable files

* The variables are kept in a file called `variables.tf`.
* The values of variables are kept in another file called `terraform.tfvars` to give you the possibility to have a different strategy for this file as it may contain sensitive information.
