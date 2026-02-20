---
icon: clock-rotate-left
sidebar_class_name: sidebar-item-icon icon-clock-rotate-left
---

# Changelog

### 2026.02.4 - Feb 19, 2026

#### 🎉 Features and Improvements

* Connector
  * Terraform reference deletion prompts now include a close option, making it easier to back out of accidental connector changes.

#### ✅ Bug Fixes

* CI/CD
  * Workflow jobs now automatically use the latest plugin schema, so existing pipelines keep working when plugins schema evolve.
  * Brainboard worker image used for Terraform/Opentofu plugins now include Git support so workflows can reliably fetch modules from Git-based sources.
  * Clearing a Terraform/OpenTofu `-target` no longer breaks runs, as empty targets are now ignored instead of being sent to the CLI.
* Settings
  * Fixed a visual layout issue on the GitHub connection form so the page displays cleanly when adding a personal token.
* Resource configurator - TF Reference enrichment
  * Module references now correctly show their custom icons in reference displays and previews for easier identification.

***

### 2026.02.3 - Feb 18, 2026

#### 🎉 Features and Improvements

* CI/CD - Plugins
  * Runner jobs now automatically use the IaC tool and version configured on the architecture, reducing manual setup in pipelines.
  * Runner plugin execution is now streamlined around a single worker image, making plugin environments more consistent and easier to maintain.

#### ✅ Bug Fixes

* Integrations - Cloud provider
  * Cloud provider connection setup now starts on the correct wizard step, making it easier to create new credentials without confusion.
* Settings - Teams & Members
  * Team member details now load reliably and correctly display 2FA status for GraphQL-based setups.

***

### 2026.02.2 - Feb 09, 2026

#### ✅ Bug Fixes

* Code edition
  * Editing the generated code with a Module with a custom Git SSH sources now preserve existing the settings so you can remove or update parameters without unexpected resets.
* Design area / diagram
  * Clicking a connector anchor point no longer creates “ghost” connectors, reducing accidental connections during editing.
* Global
  * Environments indicators now use a clearer icon so they’re easier to distinguish from public visibility.
* Node / Containers
  * Deleting a node from the context menu now only removes it from the diagram.
* Resource configuration
  * Duplicating repeatable configuration blocks now works correctly without false “duplicate” conflicts.

***

### 2026.02.1 - Feb 03, 2026

#### ✅ Bug Fixes

* Git credentials
  * Fixed an issue where secret fields could not be fully cleared when editing Git connections, improving credential updates for existing setups.
* Topbar
  * Improved spacing and responsive behavior so key actions and tabs stay accessible on smaller screens.
* Variables/Locals/Output
  * Improved the Variables pages layout on small screens, including better menu highlighting and clearer empty-state positioning.
* Self hosted runners
  * Fixed missing “job starting” status messages in self-hosted runner logs so job progress is easier to track during execution.

***

### 2026.01.9 - Jan 29, 2026

#### 🎉 Features and Improvements

* Module
  * Module fields (ie module's variable) without an explicit type now automatically the default value to infer the type (e.g., boolean, number, list, map). The type is used in our Resource configuration form and in the code generation as well.

#### ✅ Bug Fixes

* Module
  * Custom-typed module's field are now generated correctly in Terraform without unwanted quotes, preventing invalid `true/false` values in output.
* Resource Configuration - Suggestion assistant
  * The `depends_on` field now stops at the resource level (no attribute selection), avoiding incorrect references and extra steps when defining dependencies.
  * The suggestion assistant dropdown no longer close unexpectedly when selecting resource/variable filters.

***

### 2026.01.8 - Jan 27, 2026

#### ✅ Bug Fixes

* Node / Containers
  * Improved the Node Options border controls so padding and selection styling display consistently.
* Architecture
  * Unsyncing an architecture now keeps your work intact by duplicating the diagram instead of reusing the shared one.
* Code edition
  * Nested configuration blocks now preserves the correct IDs, avoiding mismatches when blocks share the same order under different parents.
* Variables/Locals/Output
  * Bulk delete for Outputs now reliably removes the selected items.

***

### 2026.01.7 - Jan 22, 2026

#### ✅ Bug Fixes

* Settings
  * Fixed Project Settings loading issues for organizations with many projects by fetching only the needed project instead of an incomplete list.
* Node Right-Click Menu
  * Updated node menu labels and icons to make common actions clearer (e.g., omitting/adding nodes to code).
* Module Import - Git credentials
  * Improved module import credential handling so Git service and credentials are selected and saved more reliably.
* RBAC/Permissions
  * Clarified project creation permissions so roles display and behave more accurately in settings.
* Infrastructure as Code
  * Improved the Terraform file selector in the right pane so long file names are easier to pick and review.

***

### 2026.01.6 - Jan 20, 2026

#### 🎉 Features and Improvements

* Cloud providers Credentials (Azure)
  * Improved the Azure “Renew certificate” flow with clearer guidance, copy-to-clipboard for the App ID, and safer validation after download.
* Topbar
  * Updated the topbar experience and removed the “new topbar” feature flag so everyone gets the same improved navigation.

#### ✅ Bug Fixes

* Workflow
  * Fixed an issue that could cause errors when opening a workflow that doesn’t exist or isn’t accessible.
* CI/CD
  * Enhanced drift checks to support Terraform variable files and better control of the IaC runtime used during scans.
* Resource Configurator (Listing)
  * Fixed resource cards showing incorrect “\[object Object]” values by improving how complex values are displayed.
* Code edition
  * Fixed invalid parsing/generated code for certain arrays so Terraform plans no longer fail due to missing separators.

***

### 2026.01.5 - Jan 14, 2026

#### 🎉 Features and Improvements

* Project selector / Architecture selector
  * Added “Expand all / Collapse all” controls and shift-click shortcuts to quickly expand or collapse project and environment trees.
* General
  * Reduced the Brainboard web app download size to speed up loading, especially on slower networks.
  * Improved how the app detects and applies new versions so updates are more reliable.

#### ✅ Bug Fixes

* Design area / diagram
  * Fixed the multi-selection node menu so “Edit TF filename” is available when multiple nodes are selected.
* State management
  * Fixed Terraform/OpenTofu state imports in pipelines when variable values are provided via a `.tfvars` file.

***

### 2026.01.4 - Jan 13, 2026

#### 🎉 Features and Improvements

* Import from files
  * Added clearer guidance and validation so you’re prompted to upload `.tf` files before generating a diagram.
* New organization
  * All new organizations have OpenTofu as default binary execution

#### ✅ Bug Fixes

* Design area
  * Fixed missing node borders while dragging and dropping nodes in the design area.
  * Fixed the node context menu not opening reliably in the design area.
  * Improved timeout and error messaging so large-diagram actions fail more clearly and provide more actionable feedback.

***

### 2026.01.2 - Jan 12, 2026

#### 🎉 Features and Improvements

* Architecture selector
  * Projects and environments in the architecture selector now stay collapsed until you expand them, making navigation clearer and less cluttered.
  * The currently selected architecture is now highlighted more consistently in the selector.
* Design area / diagram
  * Resource cards now use a virtualized list for smoother scrolling and better performance on large architectures.
* Git credentials
  * Bitbucket connections now use an API token instead of a password for a more secure and modern authentication flow.
* Module
  * The Modules Catalog and module import experience have been refreshed for a more consistent UI and smoother workflows (including custom icons and improved dialogs).

#### ✅ Bug Fixes

* Infrastructure Management
  * Cloud configuration inheritance is now skipped safely when a referenced child node is missing, preventing errors in edge-case diagrams.
* CI/CD Plugins
  * The Checkov plugin now supports passing a repository identifier, improving scan context for teams running checks across multiple repos.

***

### 2026.01.01 - Jan 08, 2026

#### 🎉 Features and Improvements

* Design area / diagram
  * Introduced a unified, declarative node and resource menu with a global context menu, making right‑click actions consistent and easier to extend across the design area.
* Node / Containers
  * Updated node selection so clicking a node always selects it and opens the right configuration panel when appropriate, avoiding confusing partial selections.
  * Improved multi‑node alignment tools to work reliably on large selections, keeping nodes neatly aligned without layout jumps.
* Identity Card / Resource Configurator
  * Enhanced resource summaries with syntax‑highlighted tooltips for multiline or advanced values, helping users understand complex attributes without opening full editors.
* Architecture
  * Ensured architectures always keep an accurate cloud provider icon when diagrams change or are cloned, improving filtering, reporting, and provider‑specific behaviors.
* New architecture / Import from files / Restore
  * Replaced legacy file uploaders with a unified drag‑and‑drop component across variable imports, local file imports, and architecture restore, giving a consistent and more robust upload experience.
  * Relaxed overly strict invalid‑file handling so users can proceed as long as at least one valid file is present, reducing friction when importing from mixed folders.
* Cloud provider credentials
  * Added the ability to regenerate and download new Azure client certificates directly from the connections page, simplifying certificate rotation.

#### ✅ Bug Fixes

* Design area / diagram
  * Fixed a regression where the design area could feel sluggish when moving many nodes or connectors, especially in large architectures.
  * Corrected invisible hit‑areas on certain nodes so selection and dragging work reliably even when nodes have very thin strokes.
  * Resolved an issue where highlighted nodes and connectors were not always cleared correctly when closing the configurator, preventing “ghost” highlights.
* Connectors
  * Fixed connector label and endpoint moves that sometimes produced duplicate or invalid points, which could cause jagged or broken connector paths.
  * Corrected hover detection around nodes when dragging connector endpoints, so nearby nodes are highlighted accurately without false positives.
  * Ensured Terraform‑linked connectors update or detach their references correctly when endpoints move between resources, avoiding stale or broken references.
* Node / Containers
  * Fixed node option bar behavior so it no longer depends on the identity card state, ensuring options appear correctly whenever nodes are selected.
  * Addressed a bug where container toggling and icon‑only modes could leave nodes in inconsistent visual states.
* Identity Card / Resource Configurator
  * Fixed a focus issue in availability zone fields so the cursor reliably moves into the correct input after switching modes, speeding up form editing.
  * Resolved missing or stale form data when switching between resources in the configurator by resetting and unregistering fields correctly.
  * Corrected collapsible section defaults and persistence per resource type, so sections open and close predictably across sessions.
  * Removed unnecessary re‑renders in the configurator that could cause flickering or slowdowns when editing complex resources.
* Onboarding
  * Fixed a flickering issue in the onboarding form

