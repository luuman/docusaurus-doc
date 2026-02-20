# Node

### Overview

The node is the graphical object you use to build your cloud infrastructure and is the building block of the architecture.

:::tip
When you drag and drop a **node** from the left panel into the design area, you can customize both its graphical aspects and its cloud configuration to generate its Terraform code.
:::

***

### Types of nodes

#### **1. Resource**

&#x20;It represents a cloud resource for a given provider for which Brainboard generates the `resource` Terraform block.

<img src="../../.gitbook/assets/image (37).png" alt="" width="375"><figcaption></figcaption>

#### **2. Data source**

This is a read-only object that allows you to reference an existing cloud resource. Brainboard generates the `data` Terraform block for it.

The data block is indicated with a cube on its left.&#x20;

<img src="../../.gitbook/assets/image (38).png" alt="" width="375"><figcaption></figcaption>

#### **3. Icon only**

This object is used to depict a graphical component that doesn't have a Terraform code, but has a meaning in the architecture.

<img src="../../.gitbook/assets/image (22).png" alt=""><figcaption></figcaption>

#### **4. Container**

This node is supposed to contain other resources and pass some of its cloud or graphical configurations to its children.

1. **Azure example**

When you add an **AKS cluster** to the resource group, it automatically inherits the `resource_group_name` from the RG.&#x20;

<img src="../../.gitbook/assets/image (34).png" alt=""><figcaption></figcaption>

2. **AWS example**

When you add an internet gateway to the VPC, it inherits the `vpc_id` automatically from the VPC.

<img src="../../.gitbook/assets/image (35).png" alt=""><figcaption></figcaption>

3. **GCP example:** When you add compute firewall into a compute network, it inherits its `network` automatically

<img src="../../.gitbook/assets/image (36).png" alt=""><figcaption></figcaption>

:::note
**Brainboard group**

* This is a special container of resources that has a title and icon that you can customize.
* It supports nested containers.

![](<../../.gitbook/assets/image (18).png>)
:::

4. **Module**

This node represents a Terraform module for which Brainboard generates a `module` block.

By default, when you can a module, it is represented by a simple node containing the icon of the provider of the resources

<img src="../../.gitbook/assets/image (19).png" alt=""><figcaption></figcaption>

You can change any module into a container, by right-clicking on it and select `Switch to container.` You can turn it back into a node by right click and select `Switch to node`.

<img src="../../.gitbook/assets/image (20).png" alt="" width="488"><figcaption></figcaption>

5. **Shape**

This is a pure graphical object that helps you depict information that don't have a Terraform code.

Some shapes can also be containers, like rectangles and circles, which helps you group your resources without triggering cloud configuration inheritance.

<img src="../../.gitbook/assets/image (21).png" alt="" width="329"><figcaption></figcaption>

6. **Text**

This node helps create a text object to add complementary information to your cloud architecture.

***

### Graphical options

#### Options bar

The following graphical options are common to any node in the design area.

<img src="../../.gitbook/assets/image (23).png" alt=""><figcaption></figcaption>



1. **Order:** Change the z-index of the node.

<img src="../../.gitbook/assets/image (25).png" alt="" width="447"><figcaption></figcaption>

<table><thead><tr><th width="74.48138427734375">#</th><th width="203.13238525390625">Oorder</th></tr></thead><tbody><tr><td>a</td><td>Send backwards</td></tr><tr><td>b</td><td>Send to back</td></tr><tr><td>c</td><td>Bring to front</td></tr><tr><td>d</td><td>Bring forward</td></tr></tbody></table>

<table><thead><tr><th width="74.48138427734375">#</th><th width="203.13238525390625">Oorder</th></tr></thead><tbody><tr><td>a</td><td>Send backwards</td></tr><tr><td>b</td><td>Send to back</td></tr><tr><td>c</td><td>Bring to front</td></tr><tr><td>d</td><td>Bring forward</td></tr></tbody></table>



2. **Align:** This option allows you to align multiple nodes. You must select all the nodes that you need to align.&#x20;

<img src="../../.gitbook/assets/image (29).png" alt=""><figcaption></figcaption>

<table><thead><tr><th width="74.48138427734375">#</th><th width="477.2064208984375">Alignment</th></tr></thead><tbody><tr><td>a</td><td>Align nodes left</td></tr><tr><td>b</td><td>Align vertically nodes' centers</td></tr><tr><td>c</td><td>Align nodes right</td></tr><tr><td>d</td><td>Align nodes to the top</td></tr><tr><td>e</td><td>Align horizontally nodes' centers</td></tr><tr><td>f</td><td>Align nodes on the bottom</td></tr><tr><td>g</td><td>Distribute space between nodes vertically</td></tr><tr><td>h</td><td>Distribute space between nodes horizontally</td></tr><tr><td>i</td><td>Tidy up nodes</td></tr></tbody></table>

3. Change the **background colour** of the node.
4. Change the **text colour** of the node.
5. Change the **border colour** of the node.
6. Change the **border radius of the node.**
7. Make the **borders of the node dashed.**
8. Change the **border weight** of the node.
9. **Open cloud configuration:** This will open the **Resource Configuration** panel that contains all Terraform fields that you can fill. Brainboard generates the Terraform code based on this configuration.

***

#### Context menu

1. **Resource, data source and container**

These 3 types of nodes share the same options in their context menu.

<img src="../../.gitbook/assets/image (31).png" alt=""><figcaption></figcaption>

<table><thead><tr><th width="58.92578125">#</th><th width="684.6141357421875">Menu item</th></tr></thead><tbody><tr><td>a</td><td>Open the Resource Configuration panel to update the cloud configuration.</td></tr><tr><td>b</td><td>Switch the resource into data and vice versa.</td></tr><tr><td>c</td><td>Change the title of the node.</td></tr><tr><td>d</td><td>This allows you to lock/unlock the node graphically, which means it cannot be moved, resized, deleted or modified.</td></tr><tr><td>e</td><td>❓❓</td></tr><tr><td>f</td><td>Duplicate the node.</td></tr><tr><td>g</td><td>❓❓</td></tr><tr><td>h</td><td><p>Disable the Terraform code generation of the node without deleting it from the design</p><p>You can enable the code by right-clicking on the resource and choosing the option <code>Add to code</code></p></td></tr><tr><td>i</td><td>Delete the node from the design and the generated code.</td></tr></tbody></table>



2. **Module**

All the options are similar to the resource, except that for modules, you have the possibility to **switch a module visually into a container and switch it back into a normal node if needed.**

<img src="../../.gitbook/assets/image (32).png" alt="" width="393"><figcaption></figcaption>

***

### Cloud configuration

Every node that is a cloud resource will have its Terraform code automatically generated and updated when you fill in the information in the **Resource Configuration panel** or when you move the node into a parent, where it inherits some cloud properties.

:::note
Refer to the [Resource Configuration](../resource-configuration.md) page for more details about how to update the cloud configuration of nodes and all the options available.
:::

***

### Behavior

Brainboard design area is a smart canvas that has <mark style="color:$primary;">**cloud knowledge**</mark> and is able to understand the relationships and links between resources.

Explained below is the behaviour of the node in the design area.

1. A <mark style="color:$primary;">node</mark> can be selected when you click on its **Terraform** code in the right pane.
2. <mark style="color:$primary;">Nodes</mark> can be linked to each other automatically when you reference a **Terraform** attribute from one node to another.

:::note
The name of the field that references the other node is put in the text of the connector created between both resources.
:::

3. <mark style="color:$primary;">Containers</mark> can pass their cloud properties to their <mark style="color:$primary;">children</mark> when **Terraform** supports it.

:::note
Brainboard can detect what should be passed and how, and then generate the right code.
:::

4. When you update the `resource name` of any <mark style="color:$primary;">node</mark> at any level, Brainboard automatically updates all the nodes that depend on it with the **new name.**
5. A <mark style="color:$primary;">container</mark> cannot be resized smaller than its children. It has to visually indicate the children contained.
6. There is <mark style="color:$danger;">**no**</mark> inheritance between resources of different providers.

:::note
For example, you cannot add an `aws_subnet` inside `azurerm_virtual_network`.
:::

7. Within the same provider, you <mark style="color:$danger;">**cannot**</mark> do what is not allowed by the provider.

:::note
For example, you cannot add a subnet inside a subnet, VPC inside VPC, VNET inside VNET...
:::

8. When you try to add a <mark style="color:$primary;">container</mark> into another one, Brainboard automatically fixes the right order of containers based on what is accepted by the provider.

:::note
For example, if you try to add a VPC inside a subnet, Brainboard will put the subnet inside the VPC and fill the information correctly for you.
:::

9. You can still reference resources from different providers in the **Resource Configuration** panel.

:::note
For example, reference an AD user inside a VM.
:::

10. When selecting multiple resources and cloning them, Brainboard automatically generates new resource names to avoid collisions and tracks dependencies correctly. Which means the Terraform plan should pass after the **clone.**
