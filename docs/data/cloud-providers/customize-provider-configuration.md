# Customize provider configuration

There are many scenarios when customizing a cloud provider block is needed:

* **Multi-cloud deployments**: If you have resources in different cloud providers, you can use multiple providers in Terraform to manage those resources together.
* **Hybrid deployments**: If you have resources in both a cloud provider and on-premises, you can use multiple providers in Terraform to manage those resources together.
* **Third-party services:** If you are using services provided by third-party providers, you can use their provider in Terraform to manage those resources.

:::note
For example, you might be using a service like Cloudflare for DNS, and you can use the Cloudflare provider in Terraform to manage those resources
:::

* **Managing different environments** : If you want to manage different environments (e.g. development, staging, production) with different providers, you can use multiple providers in Terraform to manage those resources together.
* **Adding new resources from an unsupported provider**: If you are adding new resources to your infrastructure, you may need to add a new provider if the resources are provided by a different provider than the existing resources.
* **Updating provider version:** If the provider version you are using is not supported by the provider, you will need to update the provider version in the providers block to a supported version.
* **Modifying provider configuration**: If you have to modify the provider configuration, such as adding a region, or updating endpoint URLs, you will have to modify the providers block.
* **Access control**: If you have to restrict access to certain provider resources, you may have to modify the providers block to add authentication or authorization configuration.

To customize the provider block, you need to go to the providers list in the _Leftbar_.

* Check the button showing that you want to customize Terraform and provider configuration block

![providers\_block](../../.gitbook/assets/providers\_block.png)

After you make the changes that you need, click on _apply_ to save the changes.
