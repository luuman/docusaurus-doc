# Import from Azure

### Description

Brainboard allows you to import your cloud infrastructure from Azure, and will generate the architecture diagram, the Terraform code and the tfstate for you.

:::note
This is considered a migration to Brainboard and it is not intended to be used a remediation to the drift.

Please check [drift](../../../automation/drift/ "mention")section to understand how it works and how you can setup a remediation.
:::

### Import from Azure provider prerequisites

When importing resources from Azure provider, Brainboard will scan your cloud account resources using Azure API with the permissions assigned to the credentials you use.

The only requirement to import from Azure is to add your credentials with the right permissions.

Please refer to the [azure.md](../../../settings/integrations/cloud-providers/azure.md "mention")page to know how to connect Brainboard to your Azure environment.

:::note
* ReadOnly is enough if you want to only import the resources. If you are planning to manage the infrastructure with Brainboard after the import, you need a Contributor role.
:::

### Import cloud resources

The import process has 3 phases:

1. **Resources listing:**
   1.  Click on `New architecture` button in the top left and select `Import from your infrastructure` option:<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-10 at 15.35.53@2x.png" alt=""><figcaption></figcaption>
   2.  Select the option `From your Cloud provider` as the source of the import:<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-10 at 15.37.29@2x.png" alt=""><figcaption></figcaption>
   3.  Select `Azure` option<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-10 at 15.39.07@2x.png" alt=""><figcaption></figcaption>
   4.  Select the right credentials / subscription where you want to import the resources from<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 08.58.23@2x.png" alt=""><figcaption></figcaption>
   5.  Brainboard will scan the subscription to list `all` the resource groups visible. You select the one(s) you want to import<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 08.59.46@2x.png" alt=""><figcaption></figcaption>
   6.  Brainboard will list `all` the resources inside the resource group(s) you've selected.<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 09.04.18@2x.png" alt=""><figcaption></figcaption>

       This operation will take a few minutes to complete, depending on the number of the resource groups you selected and the number of the resources inside them.

       1. The table of the resources once available for selection
       2.  The number of credits you have for the import.

           1 credit = 1 Terraform resource generated.
2. **Filtering and selection**
   1.  Filter and select the resources to import. This table is optimized to help you filter based on different criteria and select exactly what you need:<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 09.08.12@2x.png" alt=""><figcaption></figcaption>

       Here are the different options you have:

       1.  Powerful search bar that will search across all fields but you can also target a specific field by typing the name of the column followed by `>>`. For e.g, if you want to search for a specific tag:<br>

           <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 09.12.31@2x.png" alt=""><figcaption></figcaption>
       2.  The `Type` filter allows you to display only the Azure service you want to import. Here is how it looks like if you want to only select Key vault from the list:<br>

           <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 09.14.59@2x.png" alt=""><figcaption></figcaption>
       3. The `Resource group` filter allows you to only select the resources of the RGs you are interested in. This is applicable when you have more than 1 RG.
       4.  With the `View` button, you can show/hide columns from the table<br>

           <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 09.18.18@2x.png" alt=""><figcaption></figcaption>
       5. The `Refresh` button will trigger a complete scanning of your subscription to generate a new list. This is useful in case there are changes (new resources created, for e.g), between the scan and this listing.
       6. The table contains all the resources filtered and selected by on your criteria and ready to be imported
3. **Import**
   1.  Give a name to your architecture and click `Start import`, the process starts:<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 09.34.38@2x.png" alt=""><figcaption></figcaption>

       * This operation may take a few minutes or hours based on the number of the resource groups you select and the number of the resources inside them.
       * Once the process is finished you, you'll receive a notification in the app (in the top-right corner) and an email with the link to the import. Here are samples:\
         ![](<../../../.gitbook/assets/CleanShot 2025-06-12 at 09.34.49@2x.png>)![](<../../../.gitbook/assets/CleanShot 2025-06-12 at 09.39.13@2x.png>)
   2.  If the import is successful, you will see the diagram of your infrastructure, the Terraform code and the tfstate<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 10.19.05@2x.png" alt=""><figcaption></figcaption>



### Azure permissions

In Azure, to be able to import all your resources, sometimes granting `Read` permission on the top level resource is not enough. You need to grant access to the underlying sub-resources. For e.g. to access key vault keys, you need to explicitly grant read permission on the keys even if you already have a read permission on the key vault itself.

Here is a list of the permissions you need to import your resources, that you can use to create a custom role. If you still face a permission issue on resources or permissions not listed here, you need to add them into the role.



### Limitations

When you import your cloud infrastructure, here is what you need to know about what is imported and how:

* The import uses Azure API, so all the resources available through the API are supported
* Information that are not disclosed by Azure are not available, for e.g:
  * Virtual machine passwords
  * Database passwords
  * Sensitive information

:::note
So we replace these sensitive information in the code with a placeholder string "_ignored-as-imported_"
:::

* The goal is to run the plan without having any errors, but sometimes you may have some:
  * When only one parameter is needed out of 2 possible. When we do the import, the default values are imported from Azure. So even if we are continuously improving the process to fix this mutually exclusive parameters, in some situations we keep it as it is for the user to decide what is correct.

### Exclusions and optimization

It is very important when you are importing resources to filter out those you will not maintain in Terraform (as it doesn't make sense) or ephemeral resources. You can use this list as a starting point:

<table><thead><tr><th width="442.796875">Azure path to the resources</th><th>Comment</th></tr></thead><tbody><tr><td>Microsoft.AlertsManagement/actionRules</td><td></td></tr><tr><td>Microsoft.AlertsManagement/smartDetectorAlertRules</td><td></td></tr><tr><td>Microsoft.App/managedEnvironments/certificates</td><td>We don't recommend importing sensitive information</td></tr><tr><td>Microsoft.Automation/automationAccounts/connectionTypes</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/credentials</td><td>We don't recommend importing sensitive information</td></tr><tr><td>Microsoft.Automation/automationAccounts/hybridRunbookWorkerGroups</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/hybridRunbookWorkerGroups/hybridRunbookWorkers</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/jobSchedules</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/modules</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/powerShell72Modules</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/python3Packages</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/runbooks</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/schedules</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/sourceControls</td><td></td></tr><tr><td>Microsoft.Automation/automationAccounts/variables</td><td></td></tr><tr><td>Microsoft.Compute/snapshots</td><td></td></tr><tr><td>Microsoft.ContainerRegistry/registries/scopeMaps</td><td></td></tr><tr><td>Microsoft.ContainerRegistry/registries/tokens</td><td></td></tr><tr><td>Microsoft.DBforPostgreSQL/flexibleServers/configurations</td><td>These are default to Azure</td></tr><tr><td>Microsoft.DBforPostgreSQL/flexibleServers/firewallRules</td><td></td></tr><tr><td>Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/storedProcedures</td><td>These are default to Azure</td></tr><tr><td>Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/triggers</td><td>These are default to Azure</td></tr><tr><td>Microsoft.DocumentDB/databaseAccounts/sqlRoleDefinitions</td><td>These are default to Azure</td></tr><tr><td>Microsoft.EventHub/namespaces/authorizationrules</td><td></td></tr><tr><td>Microsoft.EventHub/namespaces/eventhubs/consumergroups</td><td></td></tr><tr><td>microsoft.insights/actiongroups</td><td></td></tr><tr><td>microsoft.insights/activityLogAlerts</td><td></td></tr><tr><td>microsoft.insights/autoscalesettings</td><td></td></tr><tr><td>Microsoft.Insights/components</td><td></td></tr><tr><td>microsoft.insights/components/ProactiveDetectionConfigs</td><td></td></tr><tr><td>Microsoft.Insights/dataCollectionRules</td><td></td></tr><tr><td>Microsoft.Insights/metricalerts</td><td></td></tr><tr><td>Microsoft.Insights/scheduledqueryrules</td><td></td></tr><tr><td>Microsoft.KeyVault/vaults/keys</td><td>We don't recommend importing sensitive information</td></tr><tr><td>Microsoft.KeyVault/vaults/secrets</td><td>We don't recommend importing sensitive information</td></tr><tr><td>Microsoft.LoadTestService/loadtests</td><td></td></tr><tr><td>Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials</td><td></td></tr><tr><td>Microsoft.Network/networkSecurityGroups/securityRules</td><td>Will be imported in the definition of the NSG itself.</td></tr><tr><td>Microsoft.Network/networkWatchers</td><td></td></tr><tr><td>Microsoft.operationalInsights/querypacks</td><td></td></tr><tr><td>Microsoft.operationalInsights/querypacks/queries</td><td></td></tr><tr><td>Microsoft.OperationalInsights/workspaces/dataexports</td><td></td></tr><tr><td>Microsoft.OperationalInsights/workspaces/savedSearches</td><td></td></tr><tr><td>Microsoft.Portal/dashboards</td><td></td></tr><tr><td>Microsoft.Search/searchServices</td><td></td></tr><tr><td>Microsoft.Search/searchServices/sharedPrivateLinkResources</td><td></td></tr><tr><td>Microsoft.ServiceBus/namespaces/authorizationrules</td><td></td></tr><tr><td>Microsoft.ServiceBus/namespaces/networkrulesets</td><td></td></tr><tr><td>Microsoft.Sql/servers/databases/extendedAuditingSettings</td><td></td></tr><tr><td>Microsoft.Sql/servers/devOpsAuditingSettings</td><td></td></tr><tr><td>Microsoft.Sql/servers/extendedAuditingSettings</td><td></td></tr><tr><td>Microsoft.Sql/servers/securityAlertPolicies</td><td></td></tr><tr><td>Microsoft.Sql/servers/vulnerabilityAssessments</td><td></td></tr><tr><td>Microsoft.Web/certificates</td><td>We don't recommend importing sensitive information</td></tr></tbody></table>



### Best practices

* Do smaller imports: The golden rule is to import only resources that are supposed to be managed in the same lifecycle:
  * To reduce the blast radius
  * Have a light tfstate for future operations
  * Better diagram and code navigation
* If you have different environments like dev, staging and prod, don't import them all in one import. Separate the environments and do different imports for different purposes.
* Don't import sensitive information in clear text. Surprisingly, when you do the import, if the credentials are allowed to read the key vault secrets it will be able to list them for import. Better to not import them and just reference them using the `data objects` instead.
*   After the first import, create a version in Brainboard called for e.g, `Initial import` . This is an immutable snapshot that you can revert to if needed later.<br>

    <img src="../../../.gitbook/assets/CleanShot 2025-06-12 at 10.36.57@2x.png" alt=""><figcaption></figcaption>

