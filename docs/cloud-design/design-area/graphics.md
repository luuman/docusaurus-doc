# Graphical options

### Overview

Brainboard graphical elements within the design area help you control the visual of some aspects of the interface or display useful information.

There are four groups of graphical options:

1. **Options bar:**  It contains options that allow you to control the graphical options that are not related to a node, like the grid, the zoom, etc.
2. **Templates button:** It opens the templates catalog, where you can see the available cloud architecture templates and use them.
3. **Nodes number:** Shows either the number of nodes that are selected or present in the design area when no node is selected.
4. **Groups:** This button allows you to list & update all nodes' groups / Terraform files.

***

### 1. Options bar

<img src="../../.gitbook/assets/image (53).png" alt=""><figcaption></figcaption>

<table><thead><tr><th width="56.40740966796875" data-type="number">#</th><th width="176.370361328125">Feature</th><th width="512.2434692382812">Description</th></tr></thead><tbody><tr><td>1</td><td><strong>Select/Grab Mode</strong></td><td><p></p><p>Using this option you can switch between select and grab modes. </p><ul><li><strong>Select</strong> mode <mark style="color:$primary;">(arrow icon)</mark> allows you to select resources and interact with them</li><li><strong>Grab</strong> mode <mark style="color:$primary;">(hand icon)</mark> allows you to move the canvas.</li></ul></td></tr><tr><td>2</td><td><strong>Zoom in</strong></td><td><p></p><p>It <mark style="color:$primary;">zooms in</mark> on the design area using its center as the zoom point.</p><p>⇒ You can also use the <strong>CTRL + mouse scroll</strong> to zoom in the canvas.</p></td></tr><tr><td>3</td><td><strong>Fit content</strong></td><td>It centralizes the resources present in the design area in the middle, where all nodes are visible.</td></tr><tr><td>4</td><td><strong>Zoom out</strong></td><td><p></p><p>It <mark style="color:$primary;">zooms out</mark> the design area using its center as the zoom point.</p><p>⇒ You can also use the <strong>CTRL + mouse scroll</strong> to zoom out the canvas.</p></td></tr><tr><td>5</td><td><strong>Undo</strong></td><td>Reverses the changes.</td></tr><tr><td>6</td><td><strong>Redo</strong></td><td>Restores the changes.</td></tr><tr><td>7</td><td><strong>Sync information</strong></td><td>This button opens the window that shows you architectures that are synced with the currently opened architecture design.<br><img src="../../.gitbook/assets/image (55).png" alt=""></td></tr><tr><td>8</td><td><strong>Export architecture</strong></td><td><p><strong>A.</strong> Using this option, you can either download your diagram as </p><p>a <mark style="color:$primary;">PNG, SVG</mark> or <mark style="color:$primary;">PDF</mark> file.</p><p>You can also include the background grid in the download or set a transparent background.</p><p><br><img src="../../.gitbook/assets/image (56).png" alt=""><br><br><strong>B.</strong> Or, you can also export your file in Brainboard format<mark style="color:$primary;"><strong>(JSON)</strong></mark>.</p><p>⇒ You can share the <mark style="color:$primary;"><strong>JSON</strong></mark> file with someone else or restore it in a different organization, it will create the architecture exactly as it is with its Terraform code, variables, output and ReadMe file.</p></td></tr><tr><td>9</td><td><strong>Version history</strong></td><td>Show architecture versions. Refer to the <a href="versioning.md#list-versions">versioning page</a> for more details about how to list versions and how to restore a specific one.</td></tr><tr><td>10</td><td><strong>Grid view options</strong></td><td>Available options for grid view are: <mark style="color:$primary;">Dots</mark>, <mark style="color:$primary;">Lines</mark>, and <mark style="color:$primary;">Hide</mark>.</td></tr><tr><td>11</td><td><strong>Node view options</strong></td><td><p>You can configure the node design using the options available in this drop-down menu. You can <strong>enable/disable</strong> the following for the nodes in your design. </p><ul><li>Show titles</li><li>Show connectors</li><li>Show connector labels</li><li>Animate connector line</li><li>Animate connector circles</li></ul><p>⇒ These settings apply to all the nodes of the currently opened architecture diagram. <br><img src="../../.gitbook/assets/image (57).png" alt=""></p></td></tr><tr><td>12</td><td><strong>Readme</strong></td><td><p></p><p>This opens the <mark style="color:$primary;">README</mark> of the architecture, where you can update its content.</p><p>⇒ This file will be included in the list of the files to push to git when you perform a <strong>pull request</strong>.<br><img src="../../.gitbook/assets/image (58).png" alt=""></p></td></tr></tbody></table>

:::note
**Universal Undo/Redo**

Brainboard uses the backend as a store for undo and redo actions, which means, even if you reload your page, close & reopen the browser or even connect from a different computer, you can undo & redo your actions.
:::

***

### 2. Templates button

It allows you to open the templates catalog window, where you can see the public and private templates.&#x20;

<img src="../../.gitbook/assets/image (45).png" alt=""><figcaption></figcaption>

:::note
Refer to the [template catalog](../../data/data-structure/template.md) page for detailed information about how to use it.
:::

***

### 3. Number of nodes

This button is located in the bottom-left corner of the architecture, and it shows the number of nodes in the architecture.

<img src="../../.gitbook/assets/image (46).png" alt=""><figcaption></figcaption>



#### Selected nodes

When you select more than one node at a time, for example, when you select multiple nodes to group them, then the <mark style="color:$primary;">**total number of currently selected nodes**</mark> is displayed instead of all the nodes available in your architecture design.&#x20;

For instance, two nodes are selected in the screenshot shared below.&#x20;

<img src="../../.gitbook/assets/image (51).png" alt=""><figcaption></figcaption>

***

### 4. Groups

You can group <mark style="color:$primary;">**nodes,**</mark> and they will also be moved to the same Terraform file.

The hamburger-icon button located in the bottom-right corner of the design area displays all the groups you have in the currently opened architecture design&#x20;

<img src="../../.gitbook/assets/image (49).png" alt="" width="563"><figcaption></figcaption>

1. **Show resources:** This will select and highlight all the nodes of the group in the design area. Then, you can apply bulk formatting to all the nodes of the selected group. For example, the two grouped nodes, the <mark style="color:$primary;">**`even_handler`**</mark> and the <mark style="color:$primary;">**`Dead Letter Queue`**</mark> in the screenshot shared below have a green border of the same width.&#x20;

<img src="../../.gitbook/assets/image (50).png" alt=""><figcaption></figcaption>



2. **Delete the group:** Clicking this will delete the group and put all its resources in the main file <mark style="color:$primary;">(main.tf)</mark>.

❗This action doesn't delete the resources.

:::note
By default, all the nodes are listed/grouped in the main Terraform file, and this file cannot be deleted.&#x20;
:::

#### How to group nodes?

To group any nodes, follow these simple steps:&#x20;

1. Use the **drag and select (box select)** method, i.e., click and hold the left mouse button in an empty area near the first node, then drag a rectangle over the node(s) that you want to group with the first node.&#x20;
2. Then, right-click over the selected nodes area, and click the <mark style="color:$primary;">**`Move to file`**</mark>  option in the context menu.&#x20;
3. On the <mark style="color:$primary;">**`Edit terraform file name`**</mark> popup modal, give a reasonable name to your group, and click <mark style="color:$primary;">**`Save`**</mark>.&#x20;

<img src="../../.gitbook/assets/image (47).png" alt=""><figcaption></figcaption>



:::tip
Once a group is created, it is listed among other groups in the file and can be accessed using the group button (the hamburger icon) available in the bottom right corner of your Brainboard canvas.&#x20;
:::
