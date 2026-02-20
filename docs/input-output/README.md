---
hidden: true
---

# Values (Inputs & Outputs)

Variables are fundamental in every programming and scripting language because they are inherently useful in building dynamic programs. We use variables to store temporary values so that they can assist programming logic in simple as well as complex programs.

In Terraform, a variable is a way to store and reuse values throughout your Terraform code. Variables are defined using the `variable` block and can be used to parameterize your Terraform code, making it more flexible and reusable.

In terraform there are `4 types` of Variables that we separate in two main groups :

* Input variables
* Output variables

### Best practices

It is advisable to do the following when using input and output values:

1. **Use meaningful names**: Use descriptive and meaningful names for your input and output variables, so that it's clear what they represent. This makes it easier to understand the purpose of the variable and how it can be used.
2. Use input variables to **parameterize** your Terraform code: Use input variables to make your Terraform code more reusable and flexible. This allows you to use the same code in multiple environments or for different use cases.
3. **Validate input values**: Use the validation function to validate input values before Terraform applies the changes to the infrastructure, this will prevent errors and improve the reliability of your infrastructure.
4. Use output variables to **reference other resources**: Use output variables to reference other resources, this allows you to reference the value of other resources and use it across different parts of your infrastructure.
5. **Document** the usage of input and output variables: Document the usage of input and output variables so that others understand how it is used and what its intended usage is.
