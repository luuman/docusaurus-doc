# Use modules

To use a module in your Terraform configuration in Brainboard, you can use the black box module and add it to your schema by dragging and dropping it into the design.

You also need to specify the values for the variables defined in the module.

As an example, we will use a module for naming conventions. This module helps you to keep consistency on your resources names for Terraform. The goal of this module is to easily provide a name for each resource that requires a name in Terraform following the best practices.

1.  Drag and drop the module into your schema and open the Resource Configuration panel of the module.

    ![Use module](../../../.gitbook/assets/use\_module.png)

    The Resource Configuration panel will have all the information for the input and the attributes that the module needs to be used properly as designed. \
    In the Resource Configuration panel, you can also specify the version that you want to use for this module and extra attributes.
2. After you finish with this step, the module is ready to be used in your terraform configuration.
3.  Open a resource and use the module to generate the name of the resource. The syntax is _module.module\_name.resource\_type.\[name, name\_unique]_

    ![Call module](../../../.gitbook/assets/call\_module.png)
