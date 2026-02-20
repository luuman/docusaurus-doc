# Project RBAC

In this section you can craete and customize roles that have permission on your projects, environments and architectures. Like who is allowed to run the pipeline, update the architectures or modify variables and their scope.

<img src="../../.gitbook/assets/CleanShot 2025-04-11 at 15.38.41@2x.png" alt=""><figcaption></figcaption>

### Architecture Section

* **Job actions**
  * **Get**: View job details and status
    * **Approve**: Authorize a job to proceed to the next stage
      * **Stop**: Terminate a running job
* **Pipeline actions**
  * **Create**: Build a new pipeline
  * **List**: View all available pipelines
  * **Get**: View details of a specific pipeline
  * **Stop**: Halt a running pipeline
* **Workflow actions**
  * **Create**: Define a new workflow
  * **List**: View all workflows
  * **Get**: Access details of a specific workflow
  * **Update**: Modify an existing workflow
  * **Delete**: Remove a workflow
* **Output actions**
  * **Create**: Generate new output data
  * **Get**: View output results
  * **Update**: Modify output configurations
  * **Delete**: Remove output data
* **One Action operations**
  * **Apply**: Execute a planned change
  * **Destroy**: Remove deployed resources
  * **Validate**: Check configuration validity
  * **Plan**: Preview changes before applying
* **Architecture actions**
  * **Create**: Design a new architecture
  * **Get**: View architecture details
  * **Update**: Modify an existing architecture
  * **Delete**: Remove an architecture
  * **Clone**: Create a duplicate of an architecture
  * **Publish**: Make an architecture available to others
  * **Export**: Generate a downloadable copy of an architecture
* **Variables actions**
  * **Create**: Define new architecture variables
  * **Get**: View architecture variables
  * **Update**: Modify existing architecture variables
  * **Delete**: Remove architecture variables
* **Version actions**
  * **Create**: Create a new version
  * **Get**: View version details
  * **Checkout**: Switch to a specific version

### Project section

* **Project actions**
  * **Create**: Start a new project
  * **List**: View all projects
  * **Get**: Access specific project details
  * **Update**: Modify project settings
  * **Delete**: Remove a project
* **Variables actions**
  * **Create**: Define new project variables
  * **Get**: View project variables
  * **Update**: Modify existing project variables
  * **Delete**: Remove project variables

### Environment section

* **Environment actions**
  * **Get**: View environment details
  * **Create**: Set up a new environment
  * **Update**: Modify environment settings
  * **Delete**: Remove an environment
* **Variables actions**
  * **Create**: Define new environment variables
  * **Get**: View environment variables
  * **Update**: Modify existing environment variables
  * **Delete**: Remove environment variables
