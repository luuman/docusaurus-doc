# OPA

This plugin allows you to check your Terraform code against security policies that you define.

`OPA` is a policy-based control for cloud native environments.

* [Home page](https://www.openpolicyagent.org/)
* [Source code on Github](https://github.com/open-policy-agent/opa)

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 14.04.11@2x.png" alt=""><figcaption></figcaption>

### **Configuration options**

1. Name: This is Brainboard field to describe what this task is about.
2. Policy: the content of your policy in `rego` format.
   1. The content in this output is just an example. See examples below.
3. Extra environment variables: variables that you can define here that will be used as environment variables in the execution shell.
4. Ignore failure: if enabled, the execution of the following stage will be triggered even if the task fails.
5. Require approval: means that this task will not be executed until approved by people added in the approvers' list.
   * The task remains blocked until all approvers added in the list approve it.
   *   When enabled, it allows you to add approvers to the list<br>

       <img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 13.25.53@2x (1).png" alt=""><figcaption></figcaption>
   * The approver has to be Brainboard user
6. Decision: The decision you want the check to be evaluated against. In the format `package_name/decision`&#x20;
   1. In this example, we want to fail the pipeline if the resources don't contain the tags in the list
   2. The decision is `brainboard/deny`

### **Sample output**

<img src="../../../.gitbook/assets/CleanShot 2025-07-10 at 14.08.57@2x.png" alt=""><figcaption></figcaption>

### Examples

#### Naming convention

<pre class="language-rego"><code class="lang-rego">package brainboard

deny contains msg if {
    r := input.resource_changes[_]
    r.type == "azurerm_storage_account"
    not startswith(r.change.after.name, "bb")
    
    msg := sprintf("%v must start with bb", [r.address])
}


deny contains msg if {
<strong>    r := input.resource_changes[_]
</strong>    r.type == "azurerm_resource_group"
    not startswith(r.change.after.name, "bb-")
    
    msg := sprintf("%v must start with bb-", [r.address])
}

</code></pre>

Decision: `brainboard/deny`

#### Mandatory tags

```rego
package brainboard

required_tags := ["Environment", "Owner"]

deny contains msg if {
	r := input.resource_changes[_]
	missing_tags := {tag | tag := required_tags[_]; not r.change.after.tags[tag]}

	msg = sprintf("Resource is missing required tags: %v (%v)", [r.address, missing_tags[_]])
}
```

Decision: `brainboard/deny`

#### Unrestricted ingress for AWS Security Group

```rego
package brainboard 

deny contains msg if {
  r := input.resource_changes[_]
  r.change.after.ingress[_].cidr_blocks[_] == "0.0.0.0/0"
  msg := sprintf("%v has 0.0.0.0/0 as allowed ingress", [r.address])
}
```

Decision: `brainboard/deny`
