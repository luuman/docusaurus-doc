# Locals

A **local value** assigns a name to an [expression](https://developer.hashicorp.com/terraform/language/expressions), so you can use the name multiple times within a module instead of repeating the expression.&#x20;

Brainboard allows you to define multiple locals.

:::tip
When you define locals in Brainboard, they are added to the `locals.tf` file and in the same block `locals`&#x20;
:::

<img src="../../../.gitbook/assets/image (26) (1).png" alt=""><figcaption></figcaption>

_The table of locals is similar to the one of variables detailed above. Please refer to it to understand the different components of the user interface._

#### Creating a new local

Click on the  `Add local` button to open the modal that allows you to specify the _<mark style="color:$primary;">Name</mark>, <mark style="color:$primary;">Description</mark>_ and _<mark style="color:$primary;">Value</mark>_ of the local.

<img src="../../../.gitbook/assets/image (27) (1).png" alt="" width="375"><figcaption></figcaption>

:::note
If you are using a complex expression in the value field, you need to quote it as you can mix strings, functions, variables....
:::
