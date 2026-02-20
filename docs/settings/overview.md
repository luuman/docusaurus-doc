---
icon: sliders-up
sidebar_class_name: sidebar-item-icon icon-sliders-up
---

# Overview

## Settings

Settings in Brainboard provides a flexible and hierarchical configuration system allowing you to manage settings at different levels of your organization.&#x20;



### Overview

Settings in Brainboard are organized in a hierarchical structure that follows this inheritance pattern:

**Organization → Project → Environment → Architecture**

This hierarchical approach ensures that configurations that are shared across the hierarchy can be managed efficiently while allowing for specific overrides at any level when needed.

### Accessing Settings

#### Organization Settings

You can access Organization settings pages from the home page through the left navigation menu:

1. Go to the Home page (click on Brainboard logo in the top-left corner)
2. Click on the Settings icon in the left sidebar
3. Select Organization

#### Project Settings

You can access Project settings pages from the home page through the left navigation menu:

1. Go to the Home page (click on Brainboard logo in the top-left corner)
2. Click on the Settings icon in the left sidebar
3. Click on Projects
4. Open the project menu using the 3-dots button, and click on "Change settings"

<img src="../.gitbook/assets/kayYgWIBhuPw4xhU.png" alt=""><figcaption><p>Access Project settings page</p></figcaption>

#### Environment Settings

You can access the Environment settings pages from the Project settings pages:

1. Access the Project settings following the instructions above
2. Click on an environment chip button from the environments list to access its specific settings

<img src="../.gitbook/assets/9vW5CC03EnDbKyFD.png" alt=""><figcaption><p>Access Environment settings page</p></figcaption>

#### Architecture Settings

1. Open your architecture
2. Switch to the settings tab (using the tab selector in the middle of the topbar)

<img src="../.gitbook/assets/Uzbevowr12PkjjQr.png" alt=""><figcaption><p>Access Architecture settings page</p></figcaption>

### Hierarchical Settings Management

#### Inheritance chain

Settings follow a clear inheritance structure:

1. **Organization Level**: The highest level, affects all projects, environments, and architectures.<br>

<img src="../.gitbook/assets/Frame 15842.png" alt=""><figcaption><p>Settings defined at organization level and not overridden at any lower level</p></figcaption>

2. **Project Level**: Overrides organization settings for all environments and architectures within the project

<img src="../.gitbook/assets/Frame 15852.png" alt=""><figcaption><p>Setting defined at organization level being overridden at a project level</p></figcaption>

3. **Environment Level**: Overrides organization and project settings for all architectures within the environment

<img src="../.gitbook/assets/Frame 1586.png" alt=""><figcaption><p>Setting defined at organization level being overridden at a project level and again at an environment level</p></figcaption>

4. **Architecture Level**: The most specific level, overrides all higher-level settings for a particular architecture

<img src="../.gitbook/assets/Frame 1587.png" alt=""><figcaption><p>Setting defined at organization level being overridden at a project level , then overridden again at an environment level and finally at the architecture level</p></figcaption>



#### Visual Indicators

When viewing settings at any level, you'll see visual indicators showing:

* When a setting is locked at higher level (with the source of the lock)<img src="../.gitbook/assets/MNBibjceepNHm2Wy.png" alt="" data-size="original">



* When a setting is overridden at your level (the reset button shows that the value is set at this level)\
  <img src="../.gitbook/assets/5K12h7jcqJBJapJq.png" alt="" data-size="original">



* When a setting is locked at your level preventing any lower levels update\
  <img src="../.gitbook/assets/El4jJlfq2AfQbZQG.png" alt="" data-size="original">
