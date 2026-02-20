# Deploy runner with Kubernetes

:::warning
Feature Availability Self-Hosted Runner is available for Enterprise Plan only.
:::

### Pre-requisites

* A running Kubernetes cluster
* [Helm](https://helm.sh/docs/intro/install) installed locally
* Kubectl installed locally

Brainboard provides a Helm chart to deploy the runner in your existing Kubernetes cluster.

:::note
Please contact the support to get your customer token (`CUSTOMER_TOKEN`) to access to the charts
:::

```shell
helm registry login ghcr.io --username brainboard --password $CUSTOMER_TOKEN
```

To see the charts values and documentation you can use the following commands:

```bash
helm show values oci://ghcr.io/brainboard/helm/brainboard-runner
helm show readme oci://ghcr.io/brainboard/helm/brainboard-runner
```

### Installation

In order for the runner to enroll with your organization, you will need to provide the private self-hosted runner token you generated from the Brainboard settings page.

You can install the runner with the following command:

```bash
helm install runner oci://ghcr.io/brainboard/helm/brainboard-runner --set config.credentials.token="your-runner-token"
```

You can view all available configuration options using the commands above.

#### Register runner with your organization

Once your runner is started, you will need to register it with your organization. To do so, open a terminal inside the runner container ([see below](runner-kubernetes.md#usage)) and run the following command:

```bash
/brainboard-runner register
```

This operation only has to be done once, when the runner is started for the first time.

### Usage

To open a terminal inside the runner container, use the following command:

```bash
POD_NAME=$(kubectl get po -l app.kubernetes.io/name=brainboard-runner -o=name)
kubectl exec -ti ${POD_NAME} -c runner -- sh
```

If you want to see the logs, you can run this command:

```bash
kubectl logs -l app.kubernetes.io/name=brainboard-runner -c runner
```
