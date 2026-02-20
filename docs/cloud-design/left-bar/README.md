---
icon: shapes
sidebar_class_name: sidebar-item-icon icon-shapes
---

# Left Pane

### Overview

The left pane is where all the graphical objects are available for you to use in the design area. You can also do the following:&#x20;

* Select a specific cloud provider from the supported ones.
* Set the version of the selected cloud provider.&#x20;
* Switch between Terraform/OpenTofu resources and data sources.

Once you select a cloud provider of your choice, the **left pane's** graphical object categories are refreshed to show the relevant design elements.

For example, if you select **GCP** (Google Cloud Platform), then _**AlloyDB**_ appears under **Database** as a design element with other relevant options. However, if you select **Microsoft Azure** as your cloud service provider, then **MYSQL, CosmosDB** and other relevant database options are populated as design elements.

:::note
**Custom Brainboard sections:** Custom design elements options are also available, such as **Containers** and **Modules**.&#x20;
:::



#### Azure

<img src="../../.gitbook/assets/image (11) (1).png" alt="" width="247"><figcaption></figcaption>



#### AWS

<img src="../../.gitbook/assets/image (12) (1).png" alt="" width="241"><figcaption></figcaption>



#### GCP

<img src="../../.gitbook/assets/image (13) (1).png" alt="" width="242"><figcaption></figcaption>



### Components of the left pane

Please refer to the image shared below to have a look at the main components on the left pane. Explanation is provided below it.&#x20;

<img src="../../.gitbook/assets/image (14) (1).png" alt="" width="260"><figcaption></figcaption>

1. **Cloud providers selector:** It allows you to select the cloud provider to use in the current architecture.

:::note
The **"Custom configuration"** button under it allows you to customize the **Terraform/OpenTofu** provider block, as demonstrated in the image shared below.
:::

<img src="../../.gitbook/assets/image (5) (1).png" alt=""><figcaption></figcaption>

2. **Cloud provider version:** This is the **Terraform/OpenTofu** version of the selected provider.

:::note
* Brainboard automatically update the left pane whenever there is a new Terraform/OpenTofu version of the provider.
* When you select a version, the left pane will be updated for you to reflect the resources available in this specific version.
:::

3. **Resource type selector:** It allows you to switch between cloud resources and data sources.

:::note
When you select a resource type, the left pane will be updated accordingly to reflect the resources available within the selected resource type.
:::

4. **Search bar:** It allows you to search resources by:
   1. Full Terraform name, like _<mark style="color:$primary;">azurerm\_virtual\_network,</mark>_ _<mark style="color:$primary;">aws\_vpc</mark>_ <mark style="color:$primary;"></mark><mark style="color:$primary;">or</mark> <mark style="color:$primary;"></mark>_<mark style="color:$primary;">google\_compute\_network</mark>_.
   2. Abbreviations.
   3. Part of the word.
5. **Buttons** to easily access the configuration of **variables, locals and outputs.**
6. **An arrow** option to **collapse or expand** the left pane.
7. **Category of resources:** It contains all the resources that belong to the same category as specified by the cloud providers.

:::note
Every item is a sub-category, so you need to click on it to see all its resources.
:::

### How to use these elements in your design?

To build your cloud infrastructure, you can **drag and drop** resources from the left pane into your design space, and then you can set up their cloud configuration.
