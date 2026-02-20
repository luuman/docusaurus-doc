# Fast track

### 1. Create an account

Register [here](https://app.brainboard.co/register) to create your account. You can sign up with your Google or Microsoft login.

### 2. Create a new architecture

* Click on the `New architecture` button in the top left part.
* Select `From scratch` option.

<figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FXov8Xh004xoZNWeSN0ZS%2Ffast-track-new-architecture.png?alt=media&#x26;token=6636aac9-6249-4cf9-baa2-24a54fa35b55" alt=""><figcaption><p>New architecture</p></figcaption></figure>

### 3. Add cloud resources

Drag and drop cloud resources from the *Leftbar* to the design area to build your architecture. Customize the cloud configuration of the resources

#### Azure

<figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FKWDXz4bkaBXikjb07K26%2Ffast-track-azure-resource.png?alt=media&#x26;token=2b495b37-4b86-4f3c-ad5a-3e74539eabcd" alt=""><figcaption><p>Azure resource configuration menu</p></figcaption></figure>

#### AWS

<figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FpErOOix03wkaU13DVkCn%2Ffast-track-aws-resource.png?alt=media&#x26;token=22bf454e-bd2d-4cf7-9a7f-6ed3bee282d7" alt=""><figcaption><p>AWS resource configuration menu</p></figcaption></figure>

### 4. Inspect the auto-generated Terraform code

See the auto-generated Terraform code on the right pane.

Code for Azure & AWS resources:

<div><figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FqJTj1LaGm0oVw2tbK0rH%2Ffast-track-aws-resource-code.png?alt=media&#x26;token=19a8202e-8487-4948-8586-b836e93e2a22" alt=""><figcaption><p>AWS resource with Terraform</p></figcaption></figure> <figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2Foxdf4iE5lY3f1sNoXFkp%2Ffast-track-azure-resource-code.png?alt=media&#x26;token=5e04cc4a-75f1-4aef-b41c-832cf5efd7e9" alt=""><figcaption><p>Azure resource with Terraform</p></figcaption></figure></div>

Please refer to the support providers page to have the complete list of all supported cloud providers.

### 5. Add your cloud credentials

If you want to deploy your architecture, add your preferred cloud provider credentials [here](https://app.brainboard.co/settings/cloud-providers).

<figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FdDdk4pAy85As9meUxXkg%2Ffast-track-cloud-providers.png?alt=media&#x26;token=05b54a22-9de7-4671-bfd5-c720e0fc7dab" alt=""><figcaption><p>Cloud credentials</p></figcaption></figure>

Examples for **AWS** and **Azure** credentials.

<div><figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FRhHhR8NosFkCBPGDbGta%2Ffast-track-cloud-providers-aws.png?alt=media&#x26;token=600b0886-dcb8-4c5c-b7a6-af92b4f19a3c" alt=""><figcaption><p>AWS list of credentials</p></figcaption></figure> <figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FagcHxiGf8G1ITRKZOlCU%2Ffast-track-cloud-providers-azure.png?alt=media&#x26;token=6a1d71d5-0505-40b2-ad80-bad568408cdf" alt=""><figcaption><p>Azure list of credentials</p></figcaption></figure></div>

### 6. Trigger a plan

After adding your cloud credentials, you can trigger the Terraform / OpenTofu plan directly from the design area and get the output in real time.

<figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FWNIQPcQYMmohpMpTW0WM%2Ffast-track-plan-bg.png?alt=media&#x26;token=88d8587a-5f3b-41f0-8475-f3df7754c3a8" alt=""><figcaption><p>Terraform plan action</p></figcaption></figure>

#### Execution output

You see the output of the plan in the design area, in the tab next to the Terraform code:

<figure><img src="https://2733077811-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F7YhVIZuz5Brv8kisTlFL%2Fuploads%2FpqcskyNA5avsZboPgeRq%2Ffast-track-plan-output-bg.png?alt=media&#x26;token=83f55bc3-4473-4e0b-9011-a7ab0be4b61f" alt=""><figcaption><p>Terraform / OpenTofu plan output</p></figcaption></figure>
