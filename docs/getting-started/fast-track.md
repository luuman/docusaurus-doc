---
icon: stopwatch
sidebar_class_name: sidebar-item-icon icon-stopwatch
---

# Fast track

### 1. Create an account

Register [here](https://app.brainboard.co/register) to create your account. You can sign up with your Google or Microsoft login.

### 2. Create a new architecture

* Click on the `New architecture` button in the top left part.
* Select `From scratch` option.

<img src="../.gitbook/assets/fast-track-new-architecture (1).png" alt=""><figcaption><p>New architecture</p></figcaption>

### 3. Add cloud resources

Drag and drop cloud resources from the _Leftbar_ to the design area to build your architecture. Customize the cloud configuration of the resources

#### Azure

<img src="../.gitbook/assets/fast-track-azure-resource.png" alt=""><figcaption><p>Azure resource configuration menu</p></figcaption>

#### AWS

<img src="../.gitbook/assets/fast-track-aws-resource.png" alt=""><figcaption><p>AWS resource configuration menu</p></figcaption>

### 4. Inspect the auto-generated Terraform code

See the auto-generated Terraform code on the right pane.

Code for Azure & AWS resources:

<div>

<img src="../.gitbook/assets/fast-track-aws-resource-code.png" alt=""><figcaption><p>AWS resource with Terraform</p></figcaption>

 

<img src="../.gitbook/assets/fast-track-azure-resource-code.png" alt=""><figcaption><p>Azure resource with Terraform</p></figcaption>

</div>

Please refer to the support providers page to have the complete list of all supported cloud providers.

### 5. Add your cloud credentials

If you want to deploy your architecture, add your preferred cloud provider credentials [here](https://app.brainboard.co/settings/cloud-providers).

<img src="../.gitbook/assets/fast-track-cloud-providers.png" alt=""><figcaption><p>Cloud credentials</p></figcaption>

Examples for **AWS** and **Azure** credentials.

<div>

<img src="../.gitbook/assets/fast-track-cloud-providers-aws.png" alt=""><figcaption><p>AWS list of credentials</p></figcaption>

 

<img src="../.gitbook/assets/fast-track-cloud-providers-azure.png" alt=""><figcaption><p>Azure list of credentials</p></figcaption>

</div>

### 6. Trigger a plan

After adding your cloud credentials, you can trigger the Terraform / OpenTofu plan directly from the design area and get the output in real time.

<img src="../.gitbook/assets/fast-track-plan-bg.png" alt=""><figcaption><p>Terraform plan action</p></figcaption>

#### Execution output

You see the output of the plan in the design area, in the tab next to the Terraform code:

<img src="../.gitbook/assets/fast-track-plan-output-bg.png" alt=""><figcaption><p>Terraform / OpenTofu plan output</p></figcaption>
